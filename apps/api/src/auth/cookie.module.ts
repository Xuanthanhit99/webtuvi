import { Module } from '@nestjs/common';
import { CookieService } from './cookie.service';

/**
 * Sprint 10 — extracted from `AuthModule` so `UsersModule` (account deletion needs to clear auth
 * cookies on its own request, same as `logoutAll`) can import `CookieService` without creating a
 * circular `AuthModule` <-> `UsersModule` dependency (`AuthModule` already imports `UsersModule`).
 * `CookieService` itself is unchanged — this is a wiring-only extraction, not a behavior change.
 */
@Module({
  providers: [CookieService],
  exports: [CookieService],
})
export class CookieModule {}
