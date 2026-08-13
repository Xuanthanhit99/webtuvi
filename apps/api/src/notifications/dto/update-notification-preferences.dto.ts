import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateNotificationPreferencesDto {
  /** Master switch for the REMINDER class (currently: Daily Tarot availability) — when false, no
   * reminder notification is ever created for this user, in-app or email (see
   * NotificationPreferencesService docstring). */
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  reminderInApp?: boolean;

  /** Only takes effect while `reminderInApp` is also true — an email-only reminder with nothing
   * to show in-app would be a confusing, unexplainable notification (Module 21's "every AI/product
   * decision must be explainable" standard, applied here to preference design). */
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  reminderEmail?: boolean;
}
