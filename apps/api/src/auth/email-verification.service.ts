import { randomBytes } from 'crypto';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { User } from '@prisma/client';
import type { AppConfiguration } from '../config/configuration';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { ActivitiesService } from '../activities/activities.service';
import { UsersService } from '../users/users.service';
import { parseDurationMs } from '../common/utils/duration.util';
import { hashToken } from '../common/utils/hash-token.util';

@Injectable()
export class EmailVerificationService {
  private readonly config: AppConfiguration;

  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
    private readonly activitiesService: ActivitiesService,
    private readonly configService: ConfigService,
  ) {
    this.config = this.configService.get<AppConfiguration>('app')!;
  }

  async sendVerificationForUser(user: User): Promise<void> {
    await this.issueAndSend(user);
  }

  /**
   * Enumeration-safe and cooldown-respecting: always resolves without error,
   * whether the email exists, is already verified, or is under cooldown — the
   * controller returns one identical generic message for every case, mirroring
   * forgot-password's design (docs/security/sprint-1-security.md).
   */
  async resend(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    if (!user || user.emailVerifiedAt) return;

    const latest = await this.prisma.emailVerificationToken.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    if (latest) {
      const cooldownMs = parseDurationMs(this.config.emailVerification.resendCooldown);
      const elapsedMs = Date.now() - latest.createdAt.getTime();
      if (elapsedMs < cooldownMs) return;
    }

    await this.issueAndSend(user);
  }

  /**
   * Unlike password-reset's deliberately-collapsed error (see AuthService),
   * expired vs. invalid/reused IS distinguished here: the token is already a
   * secret only its recipient holds, so telling them "expired" vs. "invalid"
   * leaks nothing about any other user or account.
   */
  async verify(token: string): Promise<void> {
    const tokenHash = hashToken(token);
    const record = await this.prisma.emailVerificationToken.findUnique({ where: { tokenHash } });

    if (!record || record.usedAt) {
      throw new BadRequestException({
        code: 'VERIFICATION_TOKEN_INVALID',
        message: 'This verification link is invalid.',
      });
    }

    if (record.expiresAt < new Date()) {
      throw new BadRequestException({
        code: 'VERIFICATION_TOKEN_EXPIRED',
        message: 'This verification link has expired.',
      });
    }

    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: record.userId }, data: { emailVerifiedAt: new Date() } }),
      this.prisma.emailVerificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    ]);

    await this.activitiesService.record(record.userId, 'EMAIL_VERIFIED');
  }

  private async issueAndSend(user: User): Promise<void> {
    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + parseDurationMs(this.config.emailVerification.expiresIn));

    await this.prisma.emailVerificationToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    const verifyUrl = `${this.config.appPublicUrl}/verify-email?token=${rawToken}`;
    await this.mailService.sendVerificationEmail(user.email, verifyUrl, this.config.emailVerification.expiresIn);
  }
}
