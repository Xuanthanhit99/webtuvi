import type { JournalEntryDto } from '@beaconvie/types';
import { api } from '@/lib/api-client';

/** Every mutation here maps to an existing Journal Foundation action (create a draft, no
 * separate creation path) — see docs/architecture/journal-foundation.md "Companion integration". */
export const companionJournalApi = {
  save: (conversationId: string, messageId: string) =>
    api.post<JournalEntryDto>('/companion/journal-suggestions/save', { conversationId, messageId }),
  neverAgain: () => api.post<void>('/companion/journal-suggestions/never-again'),
};
