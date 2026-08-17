import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsIn, IsISO8601, IsOptional, IsString, IsUUID, MaxLength, ValidateNested } from 'class-validator';
import {
  ANALYTICS_FEATURES,
  ANALYTICS_NOTIFICATION_CATEGORIES,
  ANALYTICS_PREMIUM_STATUSES,
  ANALYTICS_RESULT_STATUSES,
  ANALYTICS_SPREAD_TYPES,
  CLIENT_ANALYTICS_EVENT_NAMES,
  MAX_EVENTS_PER_BATCH,
  MAX_ROUTE_LENGTH,
  MAX_SOURCE_LENGTH,
} from '../analytics.constants';

/**
 * The complete, enforced property allowlist (Product Bible-style "structured knowledge, never
 * free text" discipline, applied to analytics instead of astrology). The global `ValidationPipe`
 * (`whitelist: true, forbidNonWhitelisted: true` — main.ts) rejects the whole request with a 400
 * if any property not declared below is present, so this class *is* the privacy boundary, not
 * just documentation of one.
 */
export class AnalyticsEventPropertiesDto {
  @IsOptional()
  @IsIn(ANALYTICS_FEATURES)
  feature?: (typeof ANALYTICS_FEATURES)[number];

  @IsOptional()
  @IsString()
  @MaxLength(MAX_ROUTE_LENGTH)
  route?: string;

  @IsOptional()
  @IsIn(ANALYTICS_RESULT_STATUSES)
  resultStatus?: (typeof ANALYTICS_RESULT_STATUSES)[number];

  @IsOptional()
  @IsString()
  @MaxLength(MAX_SOURCE_LENGTH)
  source?: string;

  @IsOptional()
  @IsIn(ANALYTICS_PREMIUM_STATUSES)
  premiumStatus?: (typeof ANALYTICS_PREMIUM_STATUSES)[number];

  @IsOptional()
  @IsIn(ANALYTICS_NOTIFICATION_CATEGORIES)
  notificationCategory?: (typeof ANALYTICS_NOTIFICATION_CATEGORIES)[number];

  @IsOptional()
  @IsIn(ANALYTICS_SPREAD_TYPES)
  spreadType?: (typeof ANALYTICS_SPREAD_TYPES)[number];
}

export class AnalyticsEventInputDto {
  @IsIn(CLIENT_ANALYTICS_EVENT_NAMES, {
    message: 'event must be one of the client-allowed analytics events — server-authoritative events cannot be submitted by a client',
  })
  event!: (typeof CLIENT_ANALYTICS_EVENT_NAMES)[number];

  @IsUUID('4')
  anonymousId!: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => AnalyticsEventPropertiesDto)
  properties?: AnalyticsEventPropertiesDto;

  @IsOptional()
  @IsISO8601()
  clientTimestamp?: string;
}

export class TrackAnalyticsEventsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_EVENTS_PER_BATCH)
  @ValidateNested({ each: true })
  @Type(() => AnalyticsEventInputDto)
  events!: AnalyticsEventInputDto[];
}
