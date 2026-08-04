import type { Memory, MemoryConsentMode, MemorySourceType, MemoryStatus, MemoryType, MemoryVisibility } from '@prisma/client';
import { explainImportanceFactors } from './importance/memory-importance.calculator';

export interface MemoryDto {
  id: string;
  type: MemoryType;
  title: string;
  summary: string;
  structuredPayload: Record<string, unknown> | null;
  status: MemoryStatus;
  consentState: MemoryConsentMode;
  visibility: MemoryVisibility;
  sourceType: MemorySourceType;
  sourceConversationId: string | null;
  sourceMessageId: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  /** Sprint 3B — deterministic 0-100 score; always paired with importanceExplanations on the
   * frontend, never rendered as a bare number (see ImportanceBadge). */
  importanceScore: number;
  importanceExplanations: string[];
  pinned: boolean;
}

/** Shared by MemoryCandidateService (accept) and MemoryRecordService (CRUD/timeline) so both surfaces render an identical shape. Never includes deletedAt/lastReferencedAt/expiresAt — internal-only fields not yet exposed to the client in Sprint 3A. */
export function toMemoryDto(memory: Memory): MemoryDto {
  return {
    id: memory.id,
    type: memory.type,
    title: memory.title,
    summary: memory.summary,
    structuredPayload: (memory.structuredPayload as Record<string, unknown> | null) ?? null,
    status: memory.status,
    consentState: memory.consentState,
    visibility: memory.visibility,
    sourceType: memory.sourceType,
    sourceConversationId: memory.sourceConversationId,
    sourceMessageId: memory.sourceMessageId,
    version: memory.version,
    createdAt: memory.createdAt.toISOString(),
    updatedAt: memory.updatedAt.toISOString(),
    archivedAt: memory.archivedAt?.toISOString() ?? null,
    importanceScore: memory.importanceScore,
    importanceExplanations: explainImportanceFactors((memory.importanceFactors as Record<string, number> | null) ?? {}),
    pinned: memory.pinned,
  };
}
