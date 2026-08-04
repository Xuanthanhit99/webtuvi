import type {
  JournalAccountExportJobDto,
  JournalAutosaveResultDto,
  JournalEntryDto,
  JournalMarkdownExportDto,
  JournalMoodValue,
  JournalRevisionDto,
  JournalStateValue,
  JournalTimelineResultDto,
  ListJournalResultDto,
} from '@beaconvie/types';
import { api } from '@/lib/api-client';

export interface JournalFilters {
  q?: string;
  state?: JournalStateValue;
  mood?: JournalMoodValue;
  tag?: string;
  pinned?: boolean;
  from?: string;
  to?: string;
  sort?: 'newest' | 'oldest' | 'recently_edited';
}

function toQuery(params: object): string {
  const search = new URLSearchParams();
  Object.entries(params as Record<string, string | number | boolean | undefined>).forEach(([key, value]) => {
    if (value !== undefined && value !== '') search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export const journalApi = {
  list: (filters: JournalFilters & { page?: number; pageSize?: number } = {}) =>
    api.get<ListJournalResultDto>(`/journal${toQuery(filters)}`),
  timeline: (params: { groupBy?: 'day' | 'week' | 'month'; includeArchived?: boolean; cursor?: string; limit?: number } = {}) =>
    api.get<JournalTimelineResultDto>(`/journal/timeline${toQuery(params)}`),
  get: (id: string) => api.get<JournalEntryDto>(`/journal/${id}`),
  create: (input: { title?: string; content?: string; mood?: JournalMoodValue; tags?: string[] }) => api.post<JournalEntryDto>('/journal', input),
  update: (id: string, patch: { title?: string; content?: string; mood?: JournalMoodValue | null; tags?: string[]; visibility?: string; pinned?: boolean }) =>
    api.patch<JournalEntryDto>(`/journal/${id}`, patch),
  autosave: (id: string, patch: { title?: string; content?: string; mood?: JournalMoodValue | null; tags?: string[] }) =>
    api.post<JournalAutosaveResultDto>(`/journal/${id}/autosave`, patch),
  publish: (id: string) => api.post<JournalEntryDto>(`/journal/${id}/publish`),
  archive: (id: string) => api.post<JournalEntryDto>(`/journal/${id}/archive`),
  restore: (id: string) => api.post<JournalEntryDto>(`/journal/${id}/restore`),
  duplicate: (id: string) => api.post<JournalEntryDto>(`/journal/${id}/duplicate`),
  remove: (id: string) => api.delete<JournalEntryDto>(`/journal/${id}`),
  revisions: (id: string) => api.get<JournalRevisionDto[]>(`/journal/${id}/revisions`),

  export: {
    markdown: (id: string) => api.get<JournalMarkdownExportDto>(`/journal/${id}/export/markdown`),
    json: (id: string) => api.get<JournalEntryDto>(`/journal/${id}/export/json`),
    account: {
      create: () => api.post<JournalAccountExportJobDto>('/journal/export'),
      get: (jobId: string) => api.get<JournalAccountExportJobDto>(`/journal/export/${jobId}`),
    },
  },
};
