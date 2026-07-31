import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CookieService } from './cookie.service';
import { UsersModule } from '../users/users.module';
import { ActivitiesModule } from '../activities/activities.module';
import { JwtAuthModule } from '../common/guards/jwt-auth.module';

@Module({
  imports: [JwtAuthModule, UsersModule, ActivitiesModule],
  controllers: [AuthController],
  providers: [AuthService, CookieService],
  exports: [CookieService],
})
export class AuthModule {}
