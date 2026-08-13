import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle, Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { NotificationsService, type ListNotificationsResult } from './notifications.service';
import { NotificationPreferencesService, type NotificationPreferencesDto } from './preferences/notification-preferences.service';
import { ListNotificationsQueryDto } from './dto/list-notifications.dto';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';
import type { NotificationDto } from './notifications.mappers';

/**
 * Sprint 11 — every route owner-scoped from the authenticated request, never a client-supplied
 * userId (Sprint 11 brief §13/§30 IDOR requirement). Sits behind `JwtAuthGuard` + the project-wide
 * `CsrfGuard`.
 *
 * Release Closure finding (fixed here, not merely noted): this codebase has no global `APP_GUARD`
 * for `ThrottlerGuard` — only `CsrfGuard` is global (`csrf.module.ts`). Every named throttler
 * bucket registered in `ThrottlerModule.forRootAsync` (`app.module.ts`) is opt-in per route via an
 * explicit `@UseGuards(ThrottlerGuard)`, matching the established pattern in
 * `JournalExportController`/`MemoryExportController`/`AccountExportController`. An earlier draft
 * of this controller's own doc comment incorrectly claimed "the global default bucket already
 * covers these" — it does not; without the guard below, these routes had **no rate limiting at
 * all**. Fixed by applying `ThrottlerGuard` here, explicitly skipping every *other* named
 * throttler (`auth`/`companion`/`companion-ip`/`payment`) so this feature's traffic can never
 * accidentally share a rate-limit budget with an unrelated one — the exact historical mistake
 * `f8fcba1` (`AuthThrottlerGuard` vs `CompanionThrottlerGuard`) fixed once already in this
 * codebase. `default: { limit: 120, ttl: 60_000 }` is generous enough for the unread-count badge's
 * 60s polling plus normal list/read/preference interaction, per Sprint 11 brief §31 ("mark-read/
 * read-all should not have absurdly low limits").
 */
@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard, ThrottlerGuard)
@SkipThrottle({ auth: true, companion: true, 'companion-ip': true, payment: true })
@Throttle({ default: { limit: 120, ttl: 60_000 } })
export class NotificationsController {
  constructor(
    private readonly notifications: NotificationsService,
    private readonly preferences: NotificationPreferencesService,
  ) {}

  @Get()
  @ApiOperation({ summary: "List the caller's own notifications, paginated, newest first" })
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: ListNotificationsQueryDto): Promise<ListNotificationsResult> {
    return this.notifications.list(user.id, query);
  }

  @Get('unread-count')
  @ApiOperation({ summary: "Get the caller's unread notification count" })
  async unreadCount(@CurrentUser() user: AuthenticatedUser): Promise<{ count: number }> {
    const count = await this.notifications.unreadCount(user.id);
    return { count };
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Mark one notification read (idempotent — owner only)' })
  markRead(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<NotificationDto> {
    return this.notifications.markRead(user.id, id);
  }

  @Post('read-all')
  @ApiOperation({ summary: "Mark all of the caller's unread notifications read" })
  markAllRead(@CurrentUser() user: AuthenticatedUser): Promise<{ updatedCount: number }> {
    return this.notifications.markAllRead(user.id);
  }

  @Get('preferences')
  @ApiOperation({ summary: "Get the caller's notification preferences (defaults if never saved)" })
  getPreferences(@CurrentUser() user: AuthenticatedUser): Promise<NotificationPreferencesDto> {
    return this.preferences.resolve(user.id);
  }

  @Patch('preferences')
  @ApiOperation({ summary: "Update the caller's notification preferences" })
  updatePreferences(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateNotificationPreferencesDto,
  ): Promise<NotificationPreferencesDto> {
    return this.preferences.update(user.id, dto);
  }
}
