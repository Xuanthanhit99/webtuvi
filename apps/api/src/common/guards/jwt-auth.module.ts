import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt-auth.guard';

/**
 * Global module so every feature module (onboarding, dashboard, companion, ...) can
 * use `@UseGuards(JwtAuthGuard)` without re-importing JwtModule everywhere. JwtService
 * here is used only for verification with an explicit `secret` per call (see
 * JwtAuthGuard) — signing still happens in AuthService with its own JwtModule import.
 */
@Global()
@Module({
  imports: [JwtModule.register({})],
  providers: [JwtAuthGuard],
  exports: [JwtModule, JwtAuthGuard],
})
export class JwtAuthModule {}
