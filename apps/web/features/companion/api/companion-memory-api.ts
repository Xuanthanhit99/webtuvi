import type { MemoryExplanationDto, MemoryTypeValue } from '@beaconvie/types';
import { api } from '@/lib/api-client';

/**
 * Every mutation here maps to an existing Sprint 3A/3B Memory API action (delete, consent
 * update) reached through an explicit confirmation step — see
 * docs/architecture/companion-memory-integration.md "Forget flow"/"Memory suggestions".
 */
export const companionMemoryApi = {
  explainUsedMemory: (conversationId: string, messageId: string, memoryId: string) =>
    api.get<MemoryExplanationDto>(`/companion/conversations/${conversationId}/messages/${messageId}/memory-explanation/${memoryId}`),
  dismissSuggestion: (type: MemoryTypeValue) => api.post<void>('/companion/memory-suggestions/dismiss', { type }),
  confirmDelete: (memoryIds: string[]) => api.post<void>('/companion/memory-forget/confirm-delete', { memoryIds }),
  confirmNeverRemember: (type: MemoryTypeValue) => api.post<void>('/companion/memory-forget/confirm-never-remember', { type }),
};
