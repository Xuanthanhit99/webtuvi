import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class RecommendationsQueryDto {
  @ApiPropertyOptional({ description: 'Optional free-text context hint (e.g. the current conversation topic) — matched by deterministic token overlap, never an embedding.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  context?: string;

  @ApiPropertyOptional({ description: 'Max memories to return, independent of the token budget.' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}
