import { ForbiddenException } from '@nestjs/common';
import { EntitlementService } from './entitlement.service';

const USER = 'user-1';

function makeRow(overrides: Partial<{ id: string; status: string; startsAt: Date; expiresAt: Date | null; orderId: string; createdAt: Date; grantedAt: Date }> = {}) {
  return {
    id: overrides.id ?? 'ent-1',
    userId: USER,
    status: overrides.status ?? 'ACTIVE',
    source: 'PAYMENT' as const,
    startsAt: overrides.startsAt ?? new Date('2026-01-01T00:00:00Z'),
    expiresAt: overrides.expiresAt === undefined ? new Date('2026-01-31T00:00:00Z') : overrides.expiresAt,
    grantedAt: overrides.grantedAt ?? new Date('2026-01-01T00:00:00Z'),
    revokedAt: null,
    orderId: overrides.orderId ?? 'order-1',
    createdAt: overrides.createdAt ?? new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };
}

function makePrisma(rows: ReturnType<typeof makeRow>[] = []) {
  const store = [...rows];
  return {
    premiumEntitlement: {
      findFirst: jest.fn(async ({ where, orderBy }: { where: Record<string, unknown>; orderBy?: { expiresAt?: string; createdAt?: string } } = { where: {} }) => {
        let matches = store.filter((r) => matchesEntitlementWhere(r, where));
        if (orderBy?.expiresAt === 'desc') matches = [...matches].sort((a, b) => (b.expiresAt?.getTime() ?? Infinity) - (a.expiresAt?.getTime() ?? Infinity));
        if (orderBy?.createdAt === 'desc') matches = [...matches].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        return matches[0] ?? null;
      }),
      findMany: jest.fn(async ({ where }: { where: Record<string, unknown> }) => store.filter((r) => matchesEntitlementWhere(r, where)).sort((a, b) => b.startsAt.getTime() - a.startsAt.getTime())),
      create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const row = makeRow({ id: `ent-${store.length + 1}`, ...data } as never);
        store.push(row);
        return row;
      }),
    },
  };
}

// EntitlementService.grantPremium takes an already-open transaction client directly (it never
// calls `$transaction` itself — that's PaymentWebhookService's job) — so these tests can just pass
// the same mock as both the read-side `prisma` and the write-side `tx`, no `$transaction` needed.

function matchesEntitlementWhere(row: ReturnType<typeof makeRow>, where: Record<string, unknown>): boolean {
  if (where.userId !== undefined && row.userId !== where.userId) return false;
  if (where.status !== undefined && row.status !== where.status) return false;
  const startsAt = where.startsAt as { lte?: Date } | undefined;
  if (startsAt?.lte && row.startsAt > startsAt.lte) return false;
  const or = where.OR as { expiresAt: null | { gt?: Date } }[] | undefined;
  if (or) {
    const passes = or.some((clause) => {
      if (clause.expiresAt === null) return row.expiresAt === null;
      if (clause.expiresAt?.gt) return row.expiresAt !== null && row.expiresAt > clause.expiresAt.gt;
      return false;
    });
    if (!passes) return false;
  }
  return true;
}

describe('EntitlementService.hasPremiumAccess / requirePremium', () => {
  it('returns true for a user with a currently-active entitlement', async () => {
    const prisma = makePrisma([makeRow({ expiresAt: new Date(Date.now() + 86_400_000) })]);
    const service = new EntitlementService(prisma as never);
    await expect(service.hasPremiumAccess(USER)).resolves.toBe(true);
    await expect(service.requirePremium(USER)).resolves.toBeUndefined();
  });

  it('returns false for a user whose only entitlement has expired', async () => {
    const prisma = makePrisma([makeRow({ expiresAt: new Date(Date.now() - 86_400_000) })]);
    const service = new EntitlementService(prisma as never);
    await expect(service.hasPremiumAccess(USER)).resolves.toBe(false);
  });

  it('returns false for a user whose entitlement was REVOKED, even if not yet expired', async () => {
    const prisma = makePrisma([makeRow({ status: 'REVOKED', expiresAt: new Date(Date.now() + 86_400_000) })]);
    const service = new EntitlementService(prisma as never);
    await expect(service.hasPremiumAccess(USER)).resolves.toBe(false);
  });

  it('returns false for a user with no entitlement at all', async () => {
    const prisma = makePrisma([]);
    const service = new EntitlementService(prisma as never);
    await expect(service.hasPremiumAccess(USER)).resolves.toBe(false);
  });

  it('requirePremium throws PREMIUM_REQUIRED for a free user', async () => {
    const prisma = makePrisma([]);
    const service = new EntitlementService(prisma as never);
    await expect(service.requirePremium(USER)).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.requirePremium(USER)).rejects.toMatchObject({ response: { code: 'PREMIUM_REQUIRED' } });
  });

  it('a lifetime grant (expiresAt null) counts as active', async () => {
    const prisma = makePrisma([makeRow({ expiresAt: null })]);
    const service = new EntitlementService(prisma as never);
    await expect(service.hasPremiumAccess(USER)).resolves.toBe(true);
  });
});

describe('EntitlementService.getEntitlementSummary', () => {
  it('reports NONE for a user who has never purchased', async () => {
    const prisma = makePrisma([]);
    const service = new EntitlementService(prisma as never);
    await expect(service.getEntitlementSummary(USER)).resolves.toEqual({ isPremium: false, status: 'NONE', expiresAt: null });
  });

  it('reports EXPIRED (not NONE) for a user whose only entitlement lapsed', async () => {
    const expiresAt = new Date(Date.now() - 86_400_000);
    const prisma = makePrisma([makeRow({ expiresAt })]);
    const service = new EntitlementService(prisma as never);
    const summary = await service.getEntitlementSummary(USER);
    expect(summary.isPremium).toBe(false);
    expect(summary.status).toBe('EXPIRED');
  });
});

describe('EntitlementService.grantPremium — stacking behavior', () => {
  it('a first purchase starts from now and expires durationDays later', async () => {
    const prisma = makePrisma([]);
    const service = new EntitlementService(prisma as never);
    const before = Date.now();
    await service.grantPremium(prisma as never, USER, 'order-new', 30);
    const created = await prisma.premiumEntitlement.findMany({ where: { userId: USER } });
    expect(created).toHaveLength(1);
    const first = created[0]!;
    expect(first.startsAt.getTime()).toBeGreaterThanOrEqual(before);
    const expectedExpiry = first.startsAt.getTime() + 30 * 24 * 60 * 60 * 1000;
    expect(first.expiresAt!.getTime()).toBe(expectedExpiry);
  });

  it('a repeat purchase while already Premium stacks from the current furthest expiry, not from now', async () => {
    const currentExpiry = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000); // 10 days from now
    const prisma = makePrisma([makeRow({ id: 'ent-existing', expiresAt: currentExpiry, orderId: 'order-old' })]);
    const service = new EntitlementService(prisma as never);
    await service.grantPremium(prisma as never, USER, 'order-new', 30);

    const rows = await prisma.premiumEntitlement.findMany({ where: { userId: USER } });
    const newRow = rows.find((r) => r.orderId === 'order-new')!;
    expect(newRow.startsAt.getTime()).toBe(currentExpiry.getTime());
    expect(newRow.expiresAt!.getTime()).toBe(currentExpiry.getTime() + 30 * 24 * 60 * 60 * 1000);
  });
});
