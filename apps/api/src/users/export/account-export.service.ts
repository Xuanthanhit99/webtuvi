import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { MemoryConsentService } from '../../memory/consent/memory-consent.service';
import { MemoryAuditService } from '../../memory/audit/memory-audit.service';

const EXPORT_CACHE_TTL_MS = 15 * 60 * 1000;
const EXPORT_CACHE_PREFIX = 'account:export';
const EXPORT_LOCK_PREFIX = 'account:export:lock';
const EXPORT_LOCK_TTL_MS = 60_000;
const EXPORT_VERSION = 1;

export interface AccountExportResult {
  exportVersion: number;
  generatedAt: string;
  account: { id: string; email: string; displayName: string; createdAt: string; emailVerifiedAt: string | null };
  preferences: unknown;
  onboarding: unknown;
  companion: { onboardingMessages: unknown[]; conversations: unknown[] };
  memory: { memories: unknown[]; versions: unknown[]; consent: unknown; activityHistory: unknown[]; legacyNotes: unknown[] };
  journal: unknown[];
  reflections: unknown[];
  insights: unknown[];
  reviews: unknown[];
  goals: unknown[];
  discoveries: { tarot: unknown[]; numerology: unknown[]; natalChart: unknown[] };
  premium: { entitlements: unknown[]; paymentOrders: unknown[] };
  activity: unknown[];
}

export interface AccountExportJobDto {
  jobId: string;
  status: 'completed';
  result: AccountExportResult;
}

/**
 * Sprint 10 — account-wide data export. Mirrors `MemoryExportService`'s established pattern
 * exactly (synchronous, per-user Redis lock + 15-minute-cached job, no background queue — the
 * same "no unnecessary infrastructure" precedent). Every model queried here is explicitly
 * `select`-scoped to fields that are real user-facing data, never `passwordHash`, refresh-token
 * hashes, CSRF secrets, provider credentials, or internal `ProviderLog`/raw-AI-prompt content —
 * see docs/architecture/account-data-rights.md §5.
 */
@Injectable()
export class AccountExportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly memoryConsent: MemoryConsentService,
    private readonly memoryAudit: MemoryAuditService,
  ) {}

  async createExport(userId: string): Promise<AccountExportJobDto> {
    const acquired = await this.acquireLock(userId);
    if (!acquired) {
      throw new ConflictException({
        code: 'EXPORT_ALREADY_IN_PROGRESS',
        message: 'An export is already being prepared. Please wait for it to finish before starting another.',
      });
    }

    try {
      const result = await this.assemble(userId);
      const jobId = randomUUID();
      await this.cache(userId, jobId, result);
      return { jobId, status: 'completed', result };
    } finally {
      await this.releaseLock(userId);
    }
  }

  async getExport(userId: string, jobId: string): Promise<AccountExportJobDto> {
    const cached = await this.readCache(userId, jobId);
    if (!cached) {
      throw new NotFoundException({
        code: 'ACCOUNT_EXPORT_NOT_FOUND',
        message: 'That export is not available — it may have expired (exports are kept for 15 minutes). Request a new export.',
      });
    }
    return { jobId, status: 'completed', result: cached };
  }

  private async assemble(userId: string): Promise<AccountExportResult> {
    const [
      account,
      preferences,
      onboarding,
      onboardingMessages,
      conversations,
      memories,
      memoryVersions,
      memoryConsent,
      memoryActivity,
      legacyMemoryNotes,
      journal,
      reflections,
      insights,
      reviews,
      goals,
      tarot,
      numerology,
      natalChart,
      entitlements,
      paymentOrders,
      activity,
    ] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: { id: true, email: true, displayName: true, createdAt: true, emailVerifiedAt: true },
      }),
      this.prisma.userPreference.findUnique({ where: { userId } }),
      this.prisma.onboardingProgress.findUnique({ where: { userId } }),
      this.prisma.companionMessage.findMany({
        where: { userId, context: 'ONBOARDING' },
        select: { id: true, role: true, content: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.conversation.findMany({
        where: { userId },
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
          messages: { select: { id: true, role: true, content: true, createdAt: true }, orderBy: { createdAt: 'asc' } },
        },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.memory.findMany({ where: { userId, status: { not: 'DELETED' } }, orderBy: { createdAt: 'asc' } }),
      this.prisma.memoryVersion.findMany({ where: { memory: { userId } }, orderBy: { createdAt: 'asc' } }),
      this.memoryConsent.getSummary(userId),
      this.memoryAudit.recentForUser(userId, 500),
      // Deprecated Sprint 1 "Memory Highlight" notes (memory_notes table) — still actively
      // written by MemoryService/onboarding today, distinct from the Sprint 3A `Memory` system
      // above. Real user content; omitting it would silently under-export (Sprint 10 closure fix).
      this.prisma.memoryNote.findMany({
        where: { userId },
        select: { id: true, content: true, source: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.journalEntry.findMany({
        where: { userId, state: { not: 'DELETED' } },
        select: { id: true, title: true, content: true, state: true, mood: true, tags: true, pinned: true, createdAt: true, publishedAt: true },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.reflectionCandidate.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
      this.prisma.insightCandidate.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
      this.prisma.review.findMany({
        where: { userId },
        include: { sections: true },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.goal.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
      this.prisma.tarotReading.findMany({
        where: { userId },
        include: { cards: true },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.numerologyReading.findMany({
        where: { userId },
        include: { values: true },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.natalChart.findMany({
        where: { userId },
        include: { placements: true, houses: true, aspects: true },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.premiumEntitlement.findMany({
        where: { userId },
        select: { id: true, status: true, source: true, startsAt: true, expiresAt: true, grantedAt: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
      // Payment orders: safe fields only — never providerOrderCode/providerPaymentLinkId
      // (internal correlation ids), same "never expose provider correlation ids" rule the
      // checkout endpoint itself already follows (payment-foundation.md §3).
      this.prisma.paymentOrder.findMany({
        where: { userId },
        select: { id: true, product: true, amount: true, currency: true, status: true, createdAt: true, paidAt: true },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.activityEvent.findMany({
        where: { userId },
        select: { id: true, type: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    return {
      exportVersion: EXPORT_VERSION,
      generatedAt: new Date().toISOString(),
      account: {
        id: account.id,
        email: account.email,
        displayName: account.displayName,
        createdAt: account.createdAt.toISOString(),
        emailVerifiedAt: account.emailVerifiedAt ? account.emailVerifiedAt.toISOString() : null,
      },
      preferences,
      onboarding,
      companion: { onboardingMessages, conversations },
      memory: { memories, versions: memoryVersions, consent: memoryConsent, activityHistory: memoryActivity, legacyNotes: legacyMemoryNotes },
      journal,
      reflections,
      insights,
      reviews,
      goals,
      discoveries: { tarot, numerology, natalChart },
      premium: { entitlements, paymentOrders },
      activity,
    };
  }

  private key(userId: string, jobId: string): string {
    return `${EXPORT_CACHE_PREFIX}:${userId}:${jobId}`;
  }

  private lockKey(userId: string): string {
    return `${EXPORT_LOCK_PREFIX}:${userId}`;
  }

  private async acquireLock(userId: string): Promise<boolean> {
    try {
      const result = await this.redis.client.set(this.lockKey(userId), '1', 'PX', EXPORT_LOCK_TTL_MS, 'NX');
      return result === 'OK';
    } catch {
      return true; // fail open — same precedent as MemoryExportService
    }
  }

  private async releaseLock(userId: string): Promise<void> {
    try {
      await this.redis.client.del(this.lockKey(userId));
    } catch {
      // Best-effort — the TTL above self-heals a missed release.
    }
  }

  private async cache(userId: string, jobId: string, result: AccountExportResult): Promise<void> {
    try {
      await this.redis.client.set(this.key(userId, jobId), JSON.stringify(result), 'PX', EXPORT_CACHE_TTL_MS);
    } catch {
      // Fail open: the export was already computed and returned to the caller synchronously.
    }
  }

  private async readCache(userId: string, jobId: string): Promise<AccountExportResult | null> {
    try {
      const raw = await this.redis.client.get(this.key(userId, jobId));
      return raw ? (JSON.parse(raw) as AccountExportResult) : null;
    } catch {
      return null;
    }
  }
}
