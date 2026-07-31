import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CookieOptions, Response } from 'express';
import type { AppConfiguration } from '../config/configuration';
import { parseDurationMs } from '../common/utils/duration.util';

export const ACCESS_TOKEN_COOKIE = 'beaconvie_access_token';
export const REFRESH_TOKEN_COOKIE = 'beaconvie_refresh_token';

/**
 * Single place that decides cookie flags for every authentication cookie, per
 * Sprint 1 requirement: "Cookie options tập trung tại một service/helper".
 *
 * Both the access and refresh token are stored as httpOnly Secure cookies (not
 * localStorage, not a client-readable cookie) — see docs/security/sprint-1-security.md
 * for why this deliberately differs from docs/reference's "access token in memory"
 * suggestion.
 */
@Injectable()
export class CookieService {
  private readonly config: AppConfiguration;

  constructor(private readonly configService: ConfigService) {
    this.config = this.configService.get<AppConfiguration>('app')!;
  }

  private baseOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: this.config.authCookie.secure,
      sameSite: this.config.authCookie.sameSite,
      domain: this.config.authCookie.domain,
      path: '/',
    };
  }

  setAccessTokenCookie(res: Response, token: string): void {
    res.cookie(ACCESS_TOKEN_COOKIE, token, {
      ...this.baseOptions(),
      maxAge: parseDurationMs(this.config.jwt.accessExpiresIn),
    });
  }

  setRefreshTokenCookie(res: Response, token: string): void {
    res.cookie(REFRESH_TOKEN_COOKIE, token, {
      ...this.baseOptions(),
      maxAge: parseDurationMs(this.config.jwt.refreshExpiresIn),
      path: '/auth',
    });
  }

  clearAuthCookies(res: Response): void {
    res.clearCookie(ACCESS_TOKEN_COOKIE, this.baseOptions());
    res.clearCookie(REFRESH_TOKEN_COOKIE, { ...this.baseOptions(), path: '/auth' });
  }
}
