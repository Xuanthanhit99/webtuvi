import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import { AIFeature, AIProviderName } from '@prisma/client';

export const ADMIN_AI_SPEND_WINDOWS = ['today', '7d'] as const;
export type AdminAiSpendWindow = (typeof ADMIN_AI_SPEND_WINDOWS)[number];

export class AdminAiSpendQueryDto {
  @ApiPropertyOptional({ enum: ADMIN_AI_SPEND_WINDOWS })
  @IsIn(ADMIN_AI_SPEND_WINDOWS)
  window!: AdminAiSpendWindow;

  @ApiPropertyOptional({ enum: AIFeature })
  @IsOptional()
  @IsEnum(AIFeature)
  feature?: AIFeature;

  @ApiPropertyOptional({ enum: AIProviderName })
  @IsOptional()
  @IsEnum(AIProviderName)
  provider?: AIProviderName;

  /** Narrows `estimatedCostUsd`/`requestCount` (from `AIUsage`, which is user-attributed). Never
   * narrows failure counts — `ProviderLog` has no `userId` column by design (see
   * `AdminAiSpendService`'s own doc comment) — a per-user failure rate does not exist at this
   * schema's granularity and must not be synthesized. */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userId?: string;
}
