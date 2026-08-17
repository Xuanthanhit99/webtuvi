import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CookieModule } from './cookie.module';
import { EmailVerificationService } from './email-verification.service';
import { UsersModule } from '../users/users.module';
import { ActivitiesModule } from '../activities/activities.module';
import { JwtAuthModule } from '../common/guards/jwt-auth.module';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [JwtAuthModule, UsersModule, ActivitiesModule, CookieModule, AnalyticsModule],
  controllers: [AuthController],
  providers: [AuthService, EmailVerificationService],
  exports: [CookieModule],
})
export class AuthModule {}
