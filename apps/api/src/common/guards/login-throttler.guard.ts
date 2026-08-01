import { Injectable } from '@nestjs/common';
import { AuthThrottlerGuard } from './auth-throttler.guard';

/**
 * Login specifically is tracked by IP + normalized email, not IP alone:
 * credential-stuffing against one account distributed across many IPs is
 * still throttled per-account, while a shared corporate/NAT IP hitting many
 * different accounts doesn't lock out every user behind that IP (Sprint 2A
 * requirement — see docs/security/sprint-2a-security.md "Rate limiting").
 * Falls back to IP-only if the body isn't parsed/shaped as expected.
 */
@Injectable()
export class LoginThrottlerGuard extends AuthThrottlerGuard {
  protected override async getTracker(req: Record<string, unknown>): Promise<string> {
    const ip = String(req.ip ?? 'unknown-ip');
    const body = req.body as { email?: unknown } | undefined;
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : null;
    return email ? `${ip}:${email}` : ip;
  }
}
