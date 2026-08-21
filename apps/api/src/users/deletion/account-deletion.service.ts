import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Sprint 10 — account deletion. See docs/architecture/account-data-rights.md §1 for the full
 * design rationale.
 *
 * This deliberately never calls `prisma.user.delete()` and never relies on the schema's
 * `onDelete: Cascade` chain — every personal-content foreign key cascades from `User`, which
 * would also destroy `PaymentOrder`/`PremiumEntitlement` (financial/accounting records this
 * sprint must preserve). Instead: the `User` row is kept but its PII is irreversibly scrubbed and
 * `status` becomes `DELETED`; every personal-content child table is explicitly hard-deleted by
 * `userId` inside one transaction (Postgres cascade then removes each of their own grandchild
 * rows automatically — e.g. deleting `Memory` rows cascades `MemoryVersion`); `PaymentOrder`/
 * `PaymentWebhookEvent`/`PremiumEntitlement` are never touched.
 */
@Injectable()
export class AccountDeletionService {
  private readonly logger = new Logger('AccountDeletion');

  constructor(private readonly prisma: PrismaService) {}

  async deleteAccount(userId: string, password: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();

    if (user.status === 'DELETED') {
      // Idempotent-safe: a repeat request against an already-deleted account is a clean no-op,
      // not a second destructive pass or a confusing error (Phase 8 "safely repeatable behavior").
      return;
    }

    const passwordValid = await argon2.verify(user.passwordHash, password);
    if (!passwordValid) {
      throw new BadRequestException({
        code: 'WRONG_PASSWORD',
        message: 'Your password doesn’t match. Enter your current password to confirm deletion.',
      });
    }

    const scrubbedEmail = `deleted+${userId}@beaconvie.invalid`;
    const unusablePasswordHash = await argon2.hash(randomUUID());

    await this.prisma.$transaction([
      // --- Session/auth artifacts ---
      this.prisma.userSession.deleteMany({ where: { userId } }),
      this.prisma.passwordResetToken.deleteMany({ where: { userId } }),
      this.prisma.emailVerificationToken.deleteMany({ where: { userId } }),
      // --- Profile/preferences/onboarding ---
      this.prisma.userProfile.deleteMany({ where: { userId } }),
      this.prisma.userPreference.deleteMany({ where: { userId } }),
      this.prisma.onboardingProgress.deleteMany({ where: { userId } }),
      // --- Notifications (Sprint 11) — real personal content + preferences, deleted like every
      // other user-owned table above; a DELETED user is also excluded at the source, since
      // NotificationsSchedulerService only ever queries `status: 'ACTIVE'` users (see
      // docs/architecture/notification-retention.md "Account deletion"). ---
      this.prisma.notification.deleteMany({ where: { userId } }),
      this.prisma.notificationPreference.deleteMany({ where: { userId } }),
      // --- Companion ---
      this.prisma.companionMessage.deleteMany({ where: { userId } }),
      this.prisma.conversation.deleteMany({ where: { userId } }), // cascades ConversationMessage
      this.prisma.aIUsage.deleteMany({ where: { userId } }),
      // --- Memory (cascades: MemoryVersion under Memory) ---
      this.prisma.memoryNote.deleteMany({ where: { userId } }),
      this.prisma.memoryConsentSetting.deleteMany({ where: { userId } }),
      this.prisma.memoryTypeConsent.deleteMany({ where: { userId } }),
      this.prisma.memoryCandidate.deleteMany({ where: { userId } }),
      this.prisma.memory.deleteMany({ where: { userId } }),
      this.prisma.memoryAudit.deleteMany({ where: { userId } }),
      this.prisma.memoryDuplicate.deleteMany({ where: { userId } }),
      this.prisma.memoryConflict.deleteMany({ where: { userId } }),
      this.prisma.memoryMergeSuggestion.deleteMany({ where: { userId } }),
      this.prisma.memoryRetrievalLog.deleteMany({ where: { userId } }),
      // --- Journal (cascades: JournalRevision under JournalEntry) ---
      this.prisma.journalEntry.deleteMany({ where: { userId } }),
      // --- Reflection/Insight/Review/Goal (frozen modules — still real, still user-owned) ---
      this.prisma.insightRelationship.deleteMany({ where: { userId } }),
      this.prisma.insightCandidate.deleteMany({ where: { userId } }), // cascades InsightEvidence
      this.prisma.reflectionCandidate.deleteMany({ where: { userId } }), // cascades ReflectionSourceRef
      this.prisma.review.deleteMany({ where: { userId } }), // cascades ReviewSection/ReviewEvidence
      this.prisma.goal.deleteMany({ where: { userId } }), // cascades GoalMilestone/Progress/Evidence/History/Relationship
      // --- Discovery systems ---
      this.prisma.tarotReading.deleteMany({ where: { userId } }), // cascades TarotReadingCard/Session/History
      this.prisma.numerologyReading.deleteMany({ where: { userId } }), // cascades NumerologyValue/History
      this.prisma.natalChart.deleteMany({ where: { userId } }), // cascades NatalPlacement/House/Aspect/History
      // --- Personal Destiny Reports (Sprint 16) — no financial-style retention exception; see
      // docs/product/personal-destiny-report-decisions.md "Account export/deletion". Deleted
      // independently of Natal Chart/Numerology above: `natalChartId`/`numerologyReadingId` are
      // deliberately plain references, not foreign keys (see the schema comment on DestinyReport),
      // so nothing here relies on ordering relative to those two deletes. ---
      this.prisma.destinyReport.deleteMany({ where: { userId } }),
      // --- Eastern Horoscope (Sprint 17) — no financial-style retention exception; deleted like
      // every other Discovery system above (cascades EasternHoroscopeProfileHistory). ---
      this.prisma.easternHoroscopeProfile.deleteMany({ where: { userId } }),
      // --- Tử Vi (Sprint 18B.9) — no financial-style retention exception; deleted like every
      // other Discovery system above (cascades TuViChartHistory). ---
      this.prisma.tuViChart.deleteMany({ where: { userId } }),
      // --- Non-sensitive activity log (personal, not an accounting record) ---
      this.prisma.activityEvent.deleteMany({ where: { userId } }),
      // --- Deliberately NOT deleted: PaymentOrder, PaymentWebhookEvent, PremiumEntitlement ---
      // --- Anonymize the account identity itself, last ---
      this.prisma.user.update({
        where: { id: userId },
        data: { email: scrubbedEmail, displayName: 'Deleted user', passwordHash: unusablePasswordHash, status: 'DELETED' },
      }),
    ]);

    this.logger.log(`Account deleted id=${userId}`);
  }
}
