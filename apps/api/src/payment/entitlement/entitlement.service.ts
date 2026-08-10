import { ForbiddenException, Injectable } from '@nestjs/common';
import type { Prisma, PremiumEntitlementStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export type EffectiveEntitlementStatus = 'ACTIVE' | 'EXPIRED' | 'REVOKED';

export interface PremiumEntitlementSummary {
  isPremium: boolean;
  status: EffectiveEntitlementStatus | 'NONE';
  expiresAt: string | null;
}

export interface PremiumEntitlementRecord {
  id: string;
  status: EffectiveEntitlementStatus;
  source: 'PAYMENT';
  startsAt: string;
  expiresAt: string | null;
  grantedAt: string;
  orderId: string;
}

/**
 * The one authoritative place Premium access decisions converge (Phase 2 of the sprint brief) —
 * nothing else in the app should read `PremiumEntitlement` rows directly. "Current Premium access"
 * is always computed from `expiresAt` at read time rather than trusting a stored EXPIRED status,
 * so there is no background job whose failure could leave stale access in either direction — see
 * docs/architecture/premium-entitlements.md "Why status is computed, not just stored".
 */
@Injectable()
export class EntitlementService {
  constructor(private readonly prisma: PrismaService) {}

  async hasPremiumAccess(userId: string): Promise<boolean> {
    const now = new Date();
    const active = await this.prisma.premiumEntitlement.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
        startsAt: { lte: now },
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      select: { id: true },
    });
    return !!active;
  }

  async requirePremium(userId: string): Promise<void> {
    if (!(await this.hasPremiumAccess(userId))) {
      throw new ForbiddenException({
        code: 'PREMIUM_REQUIRED',
        message: 'This feature requires Premium. Upgrade to unlock it.',
      });
    }
  }

  async getEntitlementSummary(userId: string): Promise<PremiumEntitlementSummary> {
    const now = new Date();
    const active = await this.prisma.premiumEntitlement.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
        startsAt: { lte: now },
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: { expiresAt: 'desc' },
    });
    if (active) {
      return { isPremium: true, status: 'ACTIVE', expiresAt: active.expiresAt ? active.expiresAt.toISOString() : null };
    }

    const mostRecent = await this.prisma.premiumEntitlement.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } });
    if (!mostRecent) return { isPremium: false, status: 'NONE', expiresAt: null };

    const status = this.computeEffectiveStatus(mostRecent, now);
    return { isPremium: false, status, expiresAt: mostRecent.expiresAt ? mostRecent.expiresAt.toISOString() : null };
  }

  async getUserEntitlements(userId: string): Promise<PremiumEntitlementRecord[]> {
    const now = new Date();
    const rows = await this.prisma.premiumEntitlement.findMany({ where: { userId }, orderBy: { startsAt: 'desc' } });
    return rows.map((row) => ({
      id: row.id,
      status: this.computeEffectiveStatus(row, now),
      source: row.source,
      startsAt: row.startsAt.toISOString(),
      expiresAt: row.expiresAt ? row.expiresAt.toISOString() : null,
      grantedAt: row.grantedAt.toISOString(),
      orderId: row.orderId,
    }));
  }

  /** Called only from inside `PaymentWebhookService`'s transaction, after a PENDING->PAID order
   * transition has been confirmed to have happened exactly once (see that service's docstring for
   * the concurrency argument). Stacks: a repeat purchase while already Premium extends from the
   * current furthest `expiresAt`, never resets to "now". */
  async grantPremium(tx: Prisma.TransactionClient, userId: string, orderId: string, durationDays: number): Promise<void> {
    const now = new Date();
    const currentFurthest = await tx.premiumEntitlement.findFirst({
      where: { userId, status: 'ACTIVE', OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
      orderBy: { expiresAt: 'desc' },
    });

    const startsAt = currentFurthest?.expiresAt && currentFurthest.expiresAt > now ? currentFurthest.expiresAt : now;
    const expiresAt = new Date(startsAt.getTime() + durationDays * 24 * 60 * 60 * 1000);

    await tx.premiumEntitlement.create({
      data: { userId, source: 'PAYMENT', status: 'ACTIVE', startsAt, expiresAt, orderId },
    });
  }

  private computeEffectiveStatus(row: { status: PremiumEntitlementStatus; expiresAt: Date | null }, now: Date): EffectiveEntitlementStatus {
    if (row.status === 'REVOKED') return 'REVOKED';
    if (row.expiresAt && row.expiresAt <= now) return 'EXPIRED';
    return 'ACTIVE';
  }
}
