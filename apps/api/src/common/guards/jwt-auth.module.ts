import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt-auth.guard';
import { OptionalJwtAuthGuard } from './optional-jwt-auth.guard';

/**
 * Global module so every feature module (onboarding, dashboard, companion, ...) can
 * use `@UseGuards(JwtAuthGuard)` without re-importing JwtModule everywhere. JwtService
 * here is used only for verification with an explicit `secret` per call (see
 * JwtAuthGuard) — signing still happens in AuthService with its own JwtModule import.
 *
 * `OptionalJwtAuthGuard` (Sprint 13) lives here too — same token-verification logic, registered
 * alongside its stricter sibling for the same reason.
 */
@Global()
@Module({
  imports: [JwtModule.register({})],
  providers: [JwtAuthGuard, OptionalJwtAuthGuard],
  exports: [JwtModule, JwtAuthGuard, OptionalJwtAuthGuard],
})
export class JwtAuthModule {}
