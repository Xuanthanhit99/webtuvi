import type { MemoryType } from '@prisma/client';

/** Same 18-value list used by the Memory module's own DTOs (see
 * apps/api/src/memory/record/dto/timeline-query.dto.ts) — kept here too since this module
 * validates `MemoryType` independently of importing a Memory-module DTO file directly. */
export const MEMORY_TYPES: MemoryType[] = [
  'IDENTITY', 'PREFERENCE', 'GOAL', 'RELATIONSHIP', 'HABIT', 'ROUTINE', 'ACHIEVEMENT', 'CHALLENGE',
  'EMOTION', 'IMPORTANT_EVENT', 'DECISION', 'INTEREST', 'WORK', 'STUDY', 'PET', 'LOCATION_PREFERENCE',
  'HEALTH', 'CUSTOM',
];
