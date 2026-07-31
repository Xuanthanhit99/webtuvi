import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { MemoryPreference, ReflectionFrequency } from '@prisma/client';

export class UpdatePreferencesDto {
  @ApiPropertyOptional({ enum: MemoryPreference })
  @IsOptional()
  @IsEnum(MemoryPreference)
  memoryPreference?: MemoryPreference;

  @ApiPropertyOptional({ enum: ReflectionFrequency })
  @IsOptional()
  @IsEnum(ReflectionFrequency)
  reflectionFrequency?: ReflectionFrequency;

  @ApiPropertyOptional({ example: '09:00' })
  @IsOptional()
  @IsString()
  @MaxLength(5)
  checkInTime?: string;
}
