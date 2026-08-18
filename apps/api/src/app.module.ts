import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { appConfig, AppConfiguration } from './config/configuration';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { RedisService } from './redis/redis.service';
import { RedisThrottlerStorageService } from './common/throttler/redis-throttler-storage.service';
import { MailModule } from './mail/mail.module';
import { HealthModule } from './health/health.module';
import { JwtAuthModule } from './common/guards/jwt-auth.module';
import { CsrfModule } from './common/csrf/csrf.module';
import { UsersModule } from './users/users.module';
import { ActivitiesModule } from './activities/activities.module';
import { AuthModule } from './auth/auth.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { MemoryModule } from './memory/memory.module';
import { CompanionModule } from './companion/companion.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { JournalModule } from './journal/journal.module';
import { ReflectionModule } from './reflection/reflection.module';
import { InsightModule } from './insight/insight.module';
import { ReviewModule } from './review/review.module';
import { GoalModule } from './goal/goal.module';
import { PaymentModule } from './payment/payment.module';
import { TarotModule } from './tarot/tarot.module';
import { NumerologyModule } from './numerology/numerology.module';
import { GeocodingModule } from './geocoding/geocoding.module';
import { NatalChartModule } from './natal-chart/natal-chart.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ReportsModule } from './reports/reports.module';
import { EasternHoroscopeModule } from './eastern-horoscope/eastern-horoscope.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [appConfig] }),
    // Sprint 11 — the only scheduled/cron infrastructure in this codebase (see
    // docs/architecture/notification-retention.md "Scheduler architecture"). In-process only, no
    // distributed lock — see NotificationsSchedulerService's doc comment for why that's an
    // accepted, disclosed limitation at current scale.
    ScheduleModule.forRoot(),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService, RedisService],
      useFactory: (configService: ConfigService, redisService: RedisService) => {
        const config = configService.get<AppConfiguration>('app')!;
        return {
          throttlers: [
            { name: 'default', ttl: 60_000, limit: 1000 },
            { name: 'auth', ttl: config.authRateLimit.windowMs, limit: config.authRateLimit.max },
            // Companion generation endpoints (Sprint 2B audit Finding 2): one
            // per-authenticated-user bucket, plus a looser per-IP bucket as a
            // secondary abuse defense. Routes opt in via CompanionThrottlerGuard
            // and must skip the unrelated `auth` throttler explicitly (see that
            // guard's docstring) so its much tighter limit doesn't also apply.
            {
              name: 'companion',
              ttl: config.ai.rateLimit.windowMs,
              limit: config.ai.rateLimit.max,
              getTracker: (req: Record<string, unknown>) => {
                const user = req.user as { id?: string } | undefined;
                return user?.id ?? String(req.ip ?? 'unknown-ip');
              },
            },
            {
              name: 'companion-ip',
              ttl: config.ai.rateLimit.windowMs,
              limit: config.ai.rateLimit.ipMax,
            },
            // Checkout/order-creation (Sprint 7): its own per-authenticated-user bucket, isolated
            // from `companion`/`companion-ip`/`auth` exactly the way f8fcba1 isolated `auth` from
            // `companion` — see PaymentThrottlerGuard's docstring.
            {
              name: 'payment',
              ttl: config.payment.rateLimit.windowMs,
              limit: config.payment.rateLimit.max,
              getTracker: (req: Record<string, unknown>) => {
                const user = req.user as { id?: string } | undefined;
                return user?.id ?? String(req.ip ?? 'unknown-ip');
              },
            },
            // Discovery AI generation (Sprint 12): Tarot/Numerology/Natal Chart's `:id/interpret`
            // retry endpoints — the confirmed abuse vector (audit §30). Isolated the same way
            // `companion`/`companion-ip` and `payment` are; routes opt in via
            // DiscoveryThrottlerGuard and skip the unrelated buckets explicitly.
            {
              name: 'discovery',
              ttl: config.discovery.rateLimit.windowMs,
              limit: config.discovery.rateLimit.max,
              getTracker: (req: Record<string, unknown>) => {
                const user = req.user as { id?: string } | undefined;
                return user?.id ?? String(req.ip ?? 'unknown-ip');
              },
            },
            {
              name: 'discovery-ip',
              ttl: config.discovery.rateLimit.windowMs,
              limit: config.discovery.rateLimit.ipMax,
            },
          ],
          storage: new RedisThrottlerStorageService(redisService, configService),
        };
      },
    }),
    JwtAuthModule,
    CsrfModule,
    PrismaModule,
    RedisModule,
    MailModule,
    HealthModule,
    UsersModule,
    ActivitiesModule,
    AuthModule,
    MemoryModule,
    OnboardingModule,
    JournalModule,
    ReflectionModule,
    InsightModule,
    ReviewModule,
    GoalModule,
    PaymentModule,
    TarotModule,
    NumerologyModule,
    GeocodingModule,
    NatalChartModule,
    CompanionModule,
    DashboardModule,
    NotificationsModule,
    AnalyticsModule,
    ReportsModule,
    EasternHoroscopeModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
