import { Injectable } from '@nestjs/common';
import type { MemoryType } from '@prisma/client';
import { MemoryConsentService } from '../../memory/consent/memory-consent.service';
import type { MemoryReferenceDto, MemorySkipReferenceDto } from './memory-reference.types';

export interface MemoryExplanationDto {
  /** The literal required opener (Phase 3) — never "I always remember," which this service's
   * copy never contains anywhere. */
  headline: string;
  reason: string;
  source: string;
  date: string;
  consent: string;
  importance: { score: number; explanations: string[] };
}

export interface MemorySkipExplanationDto {
  headline: string;
  reason: string;
}

/**
 * Turns a `MemoryReferenceDto`/`MemorySkipReferenceDto` (already-retrieved, already-decided
 * data — see `MemoryContextAssembler`) into the plain-language explanation Phase 3 requires:
 * "I remembered this because..." with source, date, reason, consent, and importance always
 * present. Never fabricates a reason that doesn't trace back to the reference's own fields —
 * this service formats, it does not decide or infer anything new.
 */
@Injectable()
export class MemoryExplanationService {
  constructor(private readonly consent: MemoryConsentService) {}

  async explain(userId: string, reference: MemoryReferenceDto): Promise<MemoryExplanationDto> {
    const mode = await this.consent.resolveMode(userId, reference.type);
    return {
      headline: 'I remembered this because...',
      reason: reference.reason,
      source: sourceLabelFor(reference),
      date: reference.createdAt,
      consent: consentLabelFor(mode, reference.type),
      importance: reference.importance,
    };
  }

  explainSkip(reference: MemorySkipReferenceDto): MemorySkipExplanationDto {
    return {
      headline: "I didn't bring this up because...",
      reason: skipReasonLabel(reference.reason),
    };
  }
}

function sourceLabelFor(reference: MemoryReferenceDto): string {
  switch (reference.retrievalType) {
    case 'PINNED':
      return "You've pinned this, so I keep it close by.";
    case 'CONTEXT_MATCH':
      return 'It came up because it relates to what you just said.';
    case 'IMPORTANCE_RANKED':
      return "It's one of the things you've told me that stands out as important.";
  }
}

function consentLabelFor(mode: string, type: MemoryType): string {
  switch (mode) {
    case 'ALLOW_TYPE':
      return `You've allowed all ${type.toLowerCase().replace('_', ' ')} memories to be used like this.`;
    case 'ALLOW_SELECTED':
      return 'You allowed this specific memory to be used.';
    case 'ASK_EVERY_TIME':
      return 'You confirmed this one when it was saved.';
    default:
      // Defensive only — MemoryRetrievalService already excludes DENY_TYPE/DISABLED types
      // before a reference can exist at all, so this branch should be unreachable in practice.
      return 'Your current memory settings allow this.';
  }
}

function skipReasonLabel(reason: MemorySkipReferenceDto['reason']): string {
  switch (reason) {
    case 'consent_denied':
      return "you've currently turned off that type of memory.";
    case 'over_budget':
      return "there wasn't room to include it without making this reply too long.";
    case 'limit_reached':
      return "I try not to bring up more than a few things at once, and this one didn't make the cut this time.";
  }
}
