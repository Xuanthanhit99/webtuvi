import * as argon2 from 'argon2';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AccountDeletionService } from './account-deletion.service';

async function makeUser(overrides: Partial<{ status: string; passwordHash: string }> = {}) {
  return {
    id: 'user-1',
    email: 'user@example.com',
    displayName: 'Test User',
    passwordHash: overrides.passwordHash ?? (await argon2.hash('CorrectPass1!')),
    status: overrides.status ?? 'ACTIVE',
  };
}

function makePrismaMock(user: unknown) {
  return {
    user: {
      findUnique: jest.fn(async () => user),
      update: jest.fn(async (args: unknown) => args),
    },
    userSession: { deleteMany: jest.fn(async () => ({ count: 0 })) },
    passwordResetToken: { deleteMany: jest.fn(async () => ({ count: 0 })) },
    emailVerificationToken: { deleteMany: jest.fn(async () => ({ count: 0 })) },
    userProfile: { deleteMany: jest.fn(async () => ({ count: 0 })) },
    userPreference: { deleteMany: jest.fn(async () => ({ count: 0 })) },
    onboardingProgress: { deleteMany: jest.fn(async () => ({ count: 0 })) },
    notification: { deleteMany: jest.fn(async () => ({ count: 0 })) },
    notificationPreference: { deleteMany: jest.fn(async () => ({ count: 0 })) },
    companionMessage: { deleteMany: jest.fn(async () => ({ count: 0 })) },
    conversation: { deleteMany: jest.fn(async () => ({ count: 0 })) },
    aIUsage: { deleteMany: jest.fn(async () => ({ count: 0 })) },
    memoryNote: { deleteMany: jest.fn(async () => ({ count: 0 })) },
    memoryConsentSetting: { deleteMany: jest.fn(async () => ({ count: 0 })) },
    memoryTypeConsent: { deleteMany: jest.fn(async () => ({ count: 0 })) },
    memoryCandidate: { deleteMany: jest.fn(async () => ({ count: 0 })) },
    memory: { deleteMany: jest.fn(async () => ({ count: 0 })) },
    memoryAudit: { deleteMany: jest.fn(async () => ({ count: 0 })) },
    memoryDuplicate: { deleteMany: jest.fn(async () => ({ count: 0 })) },
    memoryConflict: { deleteMany: jest.fn(async () => ({ count: 0 })) },
    memoryMergeSuggestion: { deleteMany: jest.fn(async () => ({ count: 0 })) },
    memoryRetrievalLog: { deleteMany: jest.fn(async () => ({ count: 0 })) },
    journalEntry: { deleteMany: jest.fn(async () => ({ count: 0 })) },
    insightRelationship: { deleteMany: jest.fn(async () => ({ count: 0 })) },
    insightCandidate: { deleteMany: jest.fn(async () => ({ count: 0 })) },
    reflectionCandidate: { deleteMany: jest.fn(async () => ({ count: 0 })) },
    review: { deleteMany: jest.fn(async () => ({ count: 0 })) },
    goal: { deleteMany: jest.fn(async () => ({ count: 0 })) },
    tarotReading: { deleteMany: jest.fn(async () => ({ count: 0 })) },
    numerologyReading: { deleteMany: jest.fn(async () => ({ count: 0 })) },
    natalChart: { deleteMany: jest.fn(async () => ({ count: 0 })) },
    destinyReport: { deleteMany: jest.fn(async () => ({ count: 0 })) },
    easternHoroscopeProfile: { deleteMany: jest.fn(async () => ({ count: 0 })) },
    activityEvent: { deleteMany: jest.fn(async () => ({ count: 0 })) },
    // Deliberately absent: paymentOrder, paymentWebhookEvent, premiumEntitlement — if the
    // service ever tried to touch these, the mock would throw "not a function" and fail the
    // test loudly, which is exactly the point (see the "never touches payment records" test).
    $transaction: jest.fn(async (ops: unknown[]) => Promise.all(ops)),
  };
}

describe('AccountDeletionService', () => {
  it('rejects the wrong password without deleting anything', async () => {
    const user = await makeUser();
    const prisma = makePrismaMock(user);
    const service = new AccountDeletionService(prisma as never);

    await expect(service.deleteAccount('user-1', 'WrongPassword')).rejects.toThrow(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('throws for a nonexistent user', async () => {
    const prisma = makePrismaMock(null);
    const service = new AccountDeletionService(prisma as never);

    await expect(service.deleteAccount('ghost', 'anything')).rejects.toThrow(UnauthorizedException);
  });

  it('is a safe no-op for an already-deleted account (idempotent, not a second destructive pass)', async () => {
    const user = await makeUser({ status: 'DELETED' });
    const prisma = makePrismaMock(user);
    const service = new AccountDeletionService(prisma as never);

    await service.deleteAccount('user-1', 'irrelevant');

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('deletes personal content and scrubs the user row on a correct password', async () => {
    const user = await makeUser();
    const prisma = makePrismaMock(user);
    const service = new AccountDeletionService(prisma as never);

    await service.deleteAccount('user-1', 'CorrectPass1!');

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.memory.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
    expect(prisma.journalEntry.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
    expect(prisma.tarotReading.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
    expect(prisma.numerologyReading.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
    expect(prisma.natalChart.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
    expect(prisma.destinyReport.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
    expect(prisma.easternHoroscopeProfile.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
    expect(prisma.conversation.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
    expect(prisma.userSession.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
    // Sprint 11
    expect(prisma.notification.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
    expect(prisma.notificationPreference.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } });

    const updateCall = (prisma.user.update as jest.Mock).mock.calls[0][0];
    expect(updateCall.data.status).toBe('DELETED');
    expect(updateCall.data.email).toBe('deleted+user-1@beaconvie.invalid');
    expect(updateCall.data.displayName).toBe('Deleted user');
    expect(updateCall.data.passwordHash).not.toBe(user.passwordHash);
  });

  it('never touches PaymentOrder, PaymentWebhookEvent, or PremiumEntitlement — financial/accounting integrity', async () => {
    const user = await makeUser();
    const prisma = makePrismaMock(user);
    const service = new AccountDeletionService(prisma as never);

    // Would throw synchronously if the service ever referenced these missing mock properties.
    await expect(service.deleteAccount('user-1', 'CorrectPass1!')).resolves.toBeUndefined();
  });
});
