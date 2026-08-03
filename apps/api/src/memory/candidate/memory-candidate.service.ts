import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { MemoryCandidate, MemoryCandidateStatus, MemoryType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MemoryConsentService } from '../consent/memory-consent.service';
import { MemoryAuditService } from '../audit/memory-audit.service';
import { toMemoryDto, type MemoryDto } from '../memory.mappers';

export interface MemoryCandidateDto {
  id: string;
  proposedType: MemoryType;
  proposedTitle: string;
  proposedSummary: string;
  sourceConversationId: string | null;
  sourceMessageId: string | null;
  reason: string | null;
  status: MemoryCandidateStatus;
  resultingMemoryId: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

export interface ProposeCandidateParams {
  proposedType: MemoryType;
  proposedTitle: string;
  proposedSummary: string;
  structuredPayload?: Record<string, unknown>;
  sourceConversationId: string;
  sourceMessageId: string;
  reason?: string;
}

/**
 * Candidate lifecycle: CANDIDATE|PENDING_CONSENT → ACCEPTED|REJECTED. No LLM
 * extraction anywhere in this sprint — every candidate must be proposed via
 * `propose()`, which requires a real, verified, user-authored source message
 * (see the ownership + role check below). See docs/architecture/memory-engine.md
 * "Candidate lifecycle" for the full list of legitimate creation paths.
 */
@Injectable()
export class MemoryCandidateService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly consent: MemoryConsentService,
    private readonly audit: MemoryAuditService,
  ) {}

  /**
   * A candidate can only ever be proposed from something the *user themselves*
   * said — `sourceMessageId` must resolve to a `ConversationMessage` with
   * `role: 'USER'`, in a conversation the caller owns. This is what
   * structurally guarantees "no candidate creation from fabricated assistant
   * content" without needing any content/semantic analysis (out of scope for
   * this sprint): an assistant-authored message can never be `sourceMessageId`.
   */
  async propose(userId: string, params: ProposeCandidateParams): Promise<MemoryCandidateDto> {
    const conversation = await this.prisma.conversation.findUnique({ where: { id: params.sourceConversationId } });
    if (!conversation || conversation.userId !== userId) {
      throw new NotFoundException({ code: 'CONVERSATION_NOT_FOUND', message: 'That conversation was not found.' });
    }

    const message = await this.prisma.conversationMessage.findUnique({ where: { id: params.sourceMessageId } });
    if (!message || message.conversationId !== params.sourceConversationId) {
      throw new NotFoundException({ code: 'SOURCE_MESSAGE_NOT_FOUND', message: 'That message was not found in this conversation.' });
    }
    if (message.role !== 'USER') {
      throw new BadRequestException({
        code: 'SOURCE_NOT_USER_AUTHORED',
        message: 'A memory can only be proposed from something you said, not an assistant reply.',
      });
    }

    const decision = await this.consent.canAccept(userId, params.proposedType);

    const candidate = await this.prisma.memoryCandidate.create({
      data: {
        userId,
        proposedType: params.proposedType,
        proposedTitle: params.proposedTitle,
        proposedSummary: params.proposedSummary,
        structuredPayload: params.structuredPayload as Prisma.InputJsonValue | undefined,
        sourceType: 'USER_EXPLICIT',
        sourceConversationId: params.sourceConversationId,
        sourceMessageId: params.sourceMessageId,
        reason: params.reason,
        status: decision.allowed ? 'CANDIDATE' : 'PENDING_CONSENT',
      },
    });

    await this.audit.record({
      userId,
      action: 'CREATED',
      metadata: { candidateId: candidate.id, type: candidate.proposedType, consentBlocked: !decision.allowed },
    });

    return toCandidateDto(candidate);
  }

  async list(userId: string, status?: MemoryCandidateStatus): Promise<MemoryCandidateDto[]> {
    const candidates = await this.prisma.memoryCandidate.findMany({
      where: { userId, ...(status ? { status } : {}) },
      orderBy: { createdAt: 'desc' },
    });
    return candidates.map(toCandidateDto);
  }

  /**
   * Idempotent: accepting an already-`ACCEPTED` candidate returns the same
   * `Memory` it created the first time, never a second one. Creating the
   * `Memory` + its first `MemoryVersion` + marking the candidate resolved all
   * happen in one transaction, so there is no window where a candidate is
   * `ACCEPTED` without a corresponding `Memory`, or vice versa.
   */
  async accept(userId: string, candidateId: string, requestId?: string): Promise<{ memory: MemoryDto; candidate: MemoryCandidateDto }> {
    const candidate = await this.findOwned(userId, candidateId);

    if (candidate.status === 'ACCEPTED') {
      if (!candidate.resultingMemoryId) {
        throw new ConflictException({ code: 'CANDIDATE_ACCEPTED_WITHOUT_MEMORY', message: 'This candidate was already accepted but its memory could not be found.' });
      }
      const existing = await this.prisma.memory.findUnique({ where: { id: candidate.resultingMemoryId } });
      if (existing) {
        return { memory: toMemoryDto(existing), candidate: toCandidateDto(candidate) };
      }
    }
    if (candidate.status === 'REJECTED') {
      throw new ConflictException({ code: 'CANDIDATE_ALREADY_REJECTED', message: 'This candidate was already rejected and cannot be accepted.' });
    }

    const decision = await this.consent.canAccept(userId, candidate.proposedType);
    if (!decision.allowed) {
      throw new ForbiddenException({
        code: 'MEMORY_CONSENT_DENIED',
        message: `Memory consent does not currently allow accepting this type of memory (${decision.reason}). Update your memory settings to allow it, then try again.`,
      });
    }

    const memory = await this.prisma.$transaction(async (tx) => {
      const created = await tx.memory.create({
        data: {
          userId,
          type: candidate.proposedType,
          title: candidate.proposedTitle,
          summary: candidate.proposedSummary,
          structuredPayload: candidate.structuredPayload ?? undefined,
          status: 'ACCEPTED',
          consentState: decision.mode,
          visibility: 'PRIVATE',
          sourceType: candidate.sourceType,
          sourceConversationId: candidate.sourceConversationId,
          sourceMessageId: candidate.sourceMessageId,
          version: 1,
        },
      });
      await tx.memoryVersion.create({
        data: {
          memoryId: created.id,
          version: 1,
          type: created.type,
          title: created.title,
          summary: created.summary,
          structuredPayload: created.structuredPayload ?? undefined,
          visibility: created.visibility,
          changeReason: 'accepted_from_candidate',
        },
      });
      await tx.memoryCandidate.update({
        where: { id: candidateId },
        data: { status: 'ACCEPTED', resultingMemoryId: created.id, resolvedAt: new Date() },
      });
      return created;
    });

    await this.audit.record({ userId, memoryId: memory.id, action: 'ACCEPTED', requestId, metadata: { candidateId, type: memory.type } });

    return {
      memory: toMemoryDto(memory),
      candidate: { ...toCandidateDto(candidate), status: 'ACCEPTED', resultingMemoryId: memory.id },
    };
  }

  /**
   * The one sanctioned path for onboarding's "want me to remember this?"
   * consent step (`OnboardingService.respondToMemoryConsent`) — not exposed
   * via any HTTP endpoint. Onboarding's own explicit yes *is* the equivalent
   * of an already-accepted candidate, but onboarding messages live in the
   * separate, older `CompanionMessage` model (not Companion Core's
   * `Conversation`/`ConversationMessage`), so there is no real
   * `sourceConversationId`/`sourceMessageId` to reference — both are left
   * `null` rather than fabricated, exactly as the migrated legacy
   * `MemoryNote` rows already are. Still consent-checked, still creates the
   * first `MemoryVersion` and a `CREATED`+`ACCEPTED` audit trail atomically,
   * same as `accept()`. Returns `null` (creates nothing) if consent currently
   * denies it — onboarding never blocks completion on this either way, the
   * same rule as the old `MemoryNote` path it replaces.
   * See docs/architecture/memory-engine.md "Onboarding cutover".
   */
  async createDirect(
    userId: string,
    params: { type: MemoryType; title: string; summary: string; sourceType: 'ONBOARDING' },
    requestId?: string,
  ): Promise<MemoryDto | null> {
    const decision = await this.consent.canAccept(userId, params.type);
    if (!decision.allowed) {
      return null;
    }

    const memory = await this.prisma.$transaction(async (tx) => {
      const created = await tx.memory.create({
        data: {
          userId,
          type: params.type,
          title: params.title,
          summary: params.summary,
          status: 'ACCEPTED',
          consentState: decision.mode,
          visibility: 'PRIVATE',
          sourceType: params.sourceType,
          sourceConversationId: null,
          sourceMessageId: null,
          version: 1,
        },
      });
      await tx.memoryVersion.create({
        data: {
          memoryId: created.id,
          version: 1,
          type: created.type,
          title: created.title,
          summary: created.summary,
          visibility: created.visibility,
          changeReason: 'created_from_onboarding',
        },
      });
      return created;
    });

    await this.audit.record({ userId, memoryId: memory.id, action: 'CREATED', requestId, metadata: { sourceType: params.sourceType } });
    await this.audit.record({ userId, memoryId: memory.id, action: 'ACCEPTED', requestId, metadata: { sourceType: params.sourceType } });

    return toMemoryDto(memory);
  }

  /** Idempotent: rejecting an already-`REJECTED` candidate is a no-op that returns the same result. */
  async reject(userId: string, candidateId: string, requestId?: string): Promise<MemoryCandidateDto> {
    const candidate = await this.findOwned(userId, candidateId);

    if (candidate.status === 'REJECTED') {
      return toCandidateDto(candidate);
    }
    if (candidate.status === 'ACCEPTED') {
      throw new ConflictException({ code: 'CANDIDATE_ALREADY_ACCEPTED', message: 'This candidate was already accepted and cannot be rejected.' });
    }

    const updated = await this.prisma.memoryCandidate.update({
      where: { id: candidateId },
      data: { status: 'REJECTED', resolvedAt: new Date() },
    });
    await this.audit.record({ userId, action: 'REJECTED', requestId, metadata: { candidateId } });

    return toCandidateDto(updated);
  }

  private async findOwned(userId: string, id: string): Promise<MemoryCandidate> {
    const candidate = await this.prisma.memoryCandidate.findUnique({ where: { id } });
    if (!candidate || candidate.userId !== userId) {
      throw new NotFoundException({ code: 'MEMORY_CANDIDATE_NOT_FOUND', message: 'That memory candidate was not found.' });
    }
    return candidate;
  }
}

function toCandidateDto(candidate: MemoryCandidate): MemoryCandidateDto {
  return {
    id: candidate.id,
    proposedType: candidate.proposedType,
    proposedTitle: candidate.proposedTitle,
    proposedSummary: candidate.proposedSummary,
    sourceConversationId: candidate.sourceConversationId,
    sourceMessageId: candidate.sourceMessageId,
    reason: candidate.reason,
    status: candidate.status,
    resultingMemoryId: candidate.resultingMemoryId,
    createdAt: candidate.createdAt.toISOString(),
    resolvedAt: candidate.resolvedAt?.toISOString() ?? null,
  };
}
