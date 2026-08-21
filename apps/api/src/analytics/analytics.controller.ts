import { Body, Controller, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle, Throttle, ThrottlerGuard } from '@nestjs/throttler';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard';
import { SkipCsrf } from '../common/csrf/skip-csrf.decorator';
import { TrackAnalyticsEventsDto } from './dto/track-analytics-events.dto';
import { AnalyticsService } from './analytics.service';

/**
 * `@SkipCsrf()`: analytics events carry no account-state-changing side effect — nothing here can
 * move money, change a password, or alter data another request could forge a victim into
 * triggering, which is exactly the class of risk CSRF protection exists for (see every other
 * `@SkipCsrf()` route in this codebase: register/login/webhooks). Requiring the CSRF ceremony
 * would only cost reliability on the one page (landing, pre-any-mutation) that needs this most,
 * for no corresponding security benefit.
 *
 * `OptionalJwtAuthGuard` (not `JwtAuthGuard`): this endpoint must accept events from signed-out
 * visitors — most of the client-allowed event list (`landing_view`, `signup_started`, ...) can
 * only ever fire before a session exists.
 */
@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('events')
  @SkipCsrf()
  @UseGuards(OptionalJwtAuthGuard, ThrottlerGuard)
  @SkipThrottle({ auth: true, companion: true, 'companion-ip': true, payment: true, discovery: true, 'discovery-ip': true, admin: true })
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Record a batch of client-observed analytics events (best-effort, never fails the caller)' })
  async trackEvents(@Body() dto: TrackAnalyticsEventsDto, @Req() req: Request & { user?: AuthenticatedUser }): Promise<void> {
    await this.analyticsService.trackClientEvents(dto.events, req.user?.id ?? null);
  }
}
