import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppConfiguration } from '../../config/configuration';

/**
 * Signed double-submit CSRF tokens: `${random}.${hmac(random, CSRF_SECRET)}`.
 * The signature isn't checked against a session — it only proves the value
 * was minted by this server (not planted by a sibling-subdomain cookie write)
 * — the actual CSRF defense is the cookie-vs-header equality check in
 * CsrfGuard. See docs/security/sprint-2a-security.md.
 */
@Injectable()
export class CsrfService {
  private readonly secret: string;

  constructor(private readonly configService: ConfigService) {
    this.secret = this.configService.get<AppConfiguration>('app')!.csrf.secret;
  }

  generateToken(): string {
    const value = randomBytes(32).toString('hex');
    return `${value}.${this.sign(value)}`;
  }

  verifyToken(signedToken: string | undefined): boolean {
    if (!signedToken) return false;
    const [value, signature] = signedToken.split('.');
    if (!value || !signature) return false;

    const expected = this.sign(value);
    const expectedBuf = Buffer.from(expected, 'hex');
    const actualBuf = Buffer.from(signature, 'hex');
    if (expectedBuf.length !== actualBuf.length) return false;

    return timingSafeEqual(expectedBuf, actualBuf);
  }

  private sign(value: string): string {
    return createHmac('sha256', this.secret).update(value).digest('hex');
  }
}
