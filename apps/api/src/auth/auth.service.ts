import { randomBytes, createHash } from 'crypto';
import { randomUUID } from 'crypto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import type { User } from '@prisma/client';
import type { AppConfiguration } from '../config/configuration';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { ActivitiesService } from '../activities/activities.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { parseDurationMs } from '../common/utils/duration.util';

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
}

interface RefreshTokenPayload {
  sub: string;
  familyId: string;
  jti: string;
}

@Injectable()
export class AuthService {
  private readonly config: AppConfiguration;

  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
    private readonly activitiesService: ActivitiesService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.config = this.configService.get<AppConfiguration>('app')!;
  }

  async register(dto: RegisterDto, userAgent: string | undefined): Promise<{ user: User; tokens: IssuedTokens }> {
    const email = this.usersService.normalizeEmail(dto.email);
    const existing = await this.usersService.findByEmail(email);
    if (existing) {
      throw new ConflictException({
        code: 'EMAIL_ALREADY_EXISTS',
        message: 'An account already exists with this email — want to log in instead?',
      });
    }

    const passwordHash = await argon2.hash(dto.password);

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        displayName: dto.displayName.trim(),
        onboardingProgress: { create: {} },
        preference: { create: {} },
      },
    });

    await this.activitiesService.record(user.id, 'ACCOUNT_CREATED');
    void this.mailService.sendWelcomeEmail(user.email, user.displayName);

    const tokens = await this.issueTokens(user.id, userAgent);
    return { user, tokens };
  }

  async login(dto: LoginDto, userAgent: string | undefined): Promise<{ user: User; tokens: IssuedTokens }> {
    const email = this.usersService.normalizeEmail(dto.email);
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException({
        code: 'ACCOUNT_NOT_FOUND',
        message: 'We can’t find an account with that email.',
      });
    }

    const passwordValid = await argon2.verify(user.passwordHash, dto.password);
    if (!passwordValid) {
      throw new UnauthorizedException({
        code: 'WRONG_PASSWORD',
        message: 'That password doesn’t match this account.',
      });
    }

    const tokens = await this.issueTokens(user.id, userAgent);
    return { user, tokens };
  }

  /**
   * Rotates a refresh token. Reuse of a token that was already rotated away
   * revokes the entire session family — the strongest signal available at
   * Sprint 1 scope that a refresh token has been stolen (docs/reference Module 6 §10).
   */
  async refresh(refreshToken: string, userAgent: string | undefined): Promise<{ user: User; tokens: IssuedTokens }> {
    const payload = this.verifyRefreshToken(refreshToken);
    const tokenHash = hashToken(refreshToken);

    const session = await this.prisma.userSession.findUnique({ where: { refreshTokenHash: tokenHash } });

    if (!session || session.revokedAt) {
      // Either unknown, or an already-rotated token being replayed — treat both as
      // theft-indicative and revoke the whole family defensively.
      await this.prisma.userSession.updateMany({
        where: { familyId: payload.familyId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException({
        code: 'SESSION_EXPIRED',
        message: 'Your session has expired. Please log in again.',
      });
    }

    if (session.expiresAt < new Date()) {
      throw new UnauthorizedException({
        code: 'SESSION_EXPIRED',
        message: 'Your session has expired. Please log in again.',
      });
    }

    const user = await this.usersService.findById(session.userId);
    if (!user) {
      throw new UnauthorizedException({
        code: 'SESSION_EXPIRED',
        message: 'Your session has expired. Please log in again.',
      });
    }

    await this.prisma.userSession.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    const tokens = await this.issueTokens(user.id, userAgent, payload.familyId);
    return { user, tokens };
  }

  /** Revokes exactly one session (the device that called /auth/logout). */
  async logout(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) return;

    try {
      this.verifyRefreshToken(refreshToken);
    } catch {
      return;
    }

    const tokenHash = hashToken(refreshToken);
    await this.prisma.userSession.updateMany({
      where: { refreshTokenHash: tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /** Never reveals whether the email exists, per docs/reference Module 6 §11. */
  async forgotPassword(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    if (!user) return;

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + parseDurationMs(this.config.passwordReset.expiresIn));

    await this.prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    const resetUrl = `${this.config.frontendUrl}/reset-password?token=${rawToken}`;
    await this.mailService.sendPasswordResetEmail(user.email, resetUrl, this.config.passwordReset.expiresIn);
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const tokenHash = hashToken(dto.token);
    const resetToken = await this.prisma.passwordResetToken.findUnique({ where: { tokenHash } });

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      throw new BadRequestException({
        code: 'RESET_TOKEN_EXPIRED',
        message: 'This link has expired.',
      });
    }

    const passwordHash = await argon2.hash(dto.password);

    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: resetToken.userId }, data: { passwordHash } }),
      this.prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } }),
      // Resetting a password revokes every existing session — a compromised
      // password shouldn't leave old sessions valid.
      this.prisma.userSession.updateMany({
        where: { userId: resetToken.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
  }

  private async issueTokens(userId: string, userAgent: string | undefined, familyId?: string): Promise<IssuedTokens> {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException();

    const accessToken = this.jwtService.sign(
      { sub: user.id, email: user.email },
      { secret: this.config.jwt.accessSecret, expiresIn: this.config.jwt.accessExpiresIn },
    );

    const resolvedFamilyId = familyId ?? randomUUID();
    const jti = randomUUID();
    const refreshToken = this.jwtService.sign(
      { sub: user.id, familyId: resolvedFamilyId, jti } satisfies RefreshTokenPayload,
      { secret: this.config.jwt.refreshSecret, expiresIn: this.config.jwt.refreshExpiresIn },
    );

    await this.prisma.userSession.create({
      data: {
        userId: user.id,
        refreshTokenHash: hashToken(refreshToken),
        familyId: resolvedFamilyId,
        userAgent: userAgent?.slice(0, 255),
        expiresAt: new Date(Date.now() + parseDurationMs(this.config.jwt.refreshExpiresIn)),
      },
    });

    return { accessToken, refreshToken };
  }

  private verifyRefreshToken(token: string): RefreshTokenPayload {
    try {
      return this.jwtService.verify<RefreshTokenPayload>(token, { secret: this.config.jwt.refreshSecret });
    } catch {
      throw new UnauthorizedException({
        code: 'SESSION_EXPIRED',
        message: 'Your session has expired. Please log in again.',
      });
    }
  }
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
