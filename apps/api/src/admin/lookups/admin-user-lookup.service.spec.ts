import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AdminUserLookupService } from './admin-user-lookup.service';

describe('AdminUserLookupService', () => {
  const now = new Date('2026-01-01T00:00:00.000Z');
  const fullUser = {
    id: 'user-1',
    email: 'real@example.com',
    passwordHash: 'argon2$super-secret-hash-must-never-leave-this-file',
    displayName: 'Real User',
    status: 'ACTIVE',
    role: 'USER',
    emailVerifiedAt: now,
    onboardingCompletedAt: now,
    createdAt: now,
    updatedAt: now,
  };

  function makeService(userRow: typeof fullUser | null = fullUser, isPremium = false) {
    const prisma = { user: { findUnique: jest.fn().mockResolvedValue(userRow) } };
    const entitlementService = { hasPremiumAccess: jest.fn().mockResolvedValue(isPremium) };
    const service = new AdminUserLookupService(prisma as never, entitlementService as never);
    return { service, prisma, entitlementService };
  }

  it('rejects a lookup with neither email nor id', async () => {
    const { service } = makeService();
    await expect(service.lookup({})).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a lookup with both email and id (ambiguous, not "email wins")', async () => {
    const { service } = makeService();
    await expect(service.lookup({ email: 'a@x.com', id: 'user-1' })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws NotFoundException, not an empty/null result, when no user matches', async () => {
    const { service } = makeService(null);
    await expect(service.lookup({ email: 'nobody@example.com' })).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns the ALLOW-listed fields for a found user, including live Premium status', async () => {
    const { service, entitlementService } = makeService(fullUser, true);
    const result = await service.lookup({ id: 'user-1' });
    expect(result).toEqual({
      id: 'user-1',
      email: 'real@example.com',
      displayName: 'Real User',
      status: 'ACTIVE',
      role: 'USER',
      createdAt: now.toISOString(),
      emailVerifiedAt: now.toISOString(),
      onboardingCompletedAt: now.toISOString(),
      isPremium: true,
    });
    expect(entitlementService.hasPremiumAccess).toHaveBeenCalledWith('user-1');
  });

  it('never includes passwordHash in the response, even though it is present on the source row', async () => {
    const { service } = makeService(fullUser, false);
    const result = await service.lookup({ id: 'user-1' });
    expect(JSON.stringify(result)).not.toContain('argon2$super-secret-hash-must-never-leave-this-file');
    expect(result).not.toHaveProperty('passwordHash');
  });

  it('assertUserExists throws NotFoundException for a missing id and resolves silently for a real one', async () => {
    const missing = makeService(null);
    await expect(missing.service.assertUserExists('nope')).rejects.toBeInstanceOf(NotFoundException);

    const present = makeService(fullUser);
    await expect(present.service.assertUserExists('user-1')).resolves.toBeUndefined();
  });
});
