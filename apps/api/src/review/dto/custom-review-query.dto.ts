import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsOptional } from 'class-validator';

/** `@IsOptional()` here deliberately — both are semantically required for a custom review, but
 * that presence check is `resolveReviewWindow()`'s own job (it throws the specific
 * `REVIEW_WINDOW_RANGE_REQUIRED` error the frontend can render meaningfully). Marking them
 * required at the DTO level would instead short-circuit with NestJS's generic `BAD_REQUEST` from
 * `ValidationPipe` before that more specific error is ever reached — mirrors
 * `InsightTimelineQueryDto`'s own custom-range validation (Insight Experience, Sprint 5A), which
 * makes the same choice for the same reason. Still validated as real ISO8601 strings when present. */
export class CustomReviewQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601()
  to?: string;
}
