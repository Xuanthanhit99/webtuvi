import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsObject, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import type { MemoryType } from '@prisma/client';

const TYPES: MemoryType[] = [
  'IDENTITY',
  'PREFERENCE',
  'GOAL',
  'RELATIONSHIP',
  'HABIT',
  'ROUTINE',
  'ACHIEVEMENT',
  'CHALLENGE',
  'EMOTION',
  'IMPORTANT_EVENT',
  'DECISION',
  'INTEREST',
  'WORK',
  'STUDY',
  'PET',
  'LOCATION_PREFERENCE',
  'HEALTH',
  'CUSTOM',
];

export class CreateCandidateDto {
  @ApiProperty({ enum: TYPES })
  @IsIn(TYPES)
  proposedType!: MemoryType;

  @ApiProperty({ example: 'Starting a new job' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  proposedTitle!: string;

  @ApiProperty({ example: "Started a new marketing role at a startup, feeling nervous but excited." })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  proposedSummary!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  structuredPayload?: Record<string, unknown>;

  @ApiProperty()
  @IsString()
  sourceConversationId!: string;

  @ApiProperty()
  @IsString()
  sourceMessageId!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
