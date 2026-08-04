import type {
  MemoryCandidateDto,
  MemoryConflictDto,
  MemoryConsentModeValue,
  MemoryConsentSummaryDto,
  MemoryDto,
  MemoryDuplicatePairDto,
  MemoryExportJobDto,
  MemoryListResultDto,
  MemoryTimelineResultDto,
  MemoryTypeValue,
  MemoryVersionDto,
  MemoryAuditEntryDto,
  MergeSuggestionDto,
  RetrievalResultDto,
} from '@beaconvie/types';
import { api } from '@/lib/api-client';

export interface MemoryFilters {
  type?: MemoryTypeValue;
  status?: string;
  from?: string;
  to?: string;
}

function toQuery(params: object): string {
  const search = new URLSearchParams();
  Object.entries(params as Record<string, string | number | undefined>).forEach(([key, value]) => {
    if (value !== undefined && value !== '') search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export const memoryApi = {
  list: (filters: MemoryFilters & { page?: number; pageSize?: number; sort?: 'newest' | 'oldest' } = {}) =>
    api.get<MemoryListResultDto>(`/memory${toQuery(filters)}`),
  timeline: (filters: MemoryFilters & { cursor?: string; limit?: number } = {}) =>
    api.get<MemoryTimelineResultDto>(`/memory/timeline${toQuery(filters)}`),
  get: (id: string) => api.get<MemoryDto>(`/memory/${id}`),
  update: (id: string, patch: { title?: string; visibility?: string }) => api.patch<MemoryDto>(`/memory/${id}`, patch),
  remove: (id: string) => api.delete<void>(`/memory/${id}`),
  archive: (id: string) => api.post<MemoryDto>(`/memory/${id}/archive`),
  restore: (id: string) => api.post<MemoryDto>(`/memory/${id}/restore`),
  versions: (id: string) => api.get<MemoryVersionDto[]>(`/memory/${id}/versions`),
  auditTrail: (id: string) => api.get<MemoryAuditEntryDto[]>(`/memory/${id}/audit`),

  candidates: {
    list: (status?: string) => api.get<MemoryCandidateDto[]>(`/memory/candidates${toQuery({ status })}`),
    propose: (input: {
      proposedType: MemoryTypeValue;
      proposedTitle: string;
      proposedSummary: string;
      sourceConversationId: string;
      sourceMessageId: string;
      reason?: string;
    }) => api.post<MemoryCandidateDto>('/memory/candidates', input),
    accept: (id: string) => api.post<{ memory: MemoryDto; candidate: MemoryCandidateDto }>(`/memory/candidates/${id}/accept`),
    reject: (id: string) => api.post<MemoryCandidateDto>(`/memory/candidates/${id}/reject`),
  },

  consents: {
    get: () => api.get<MemoryConsentSummaryDto>('/memory/consents'),
    updateGlobal: (mode: MemoryConsentModeValue) => api.put<MemoryConsentSummaryDto>('/memory/consents', { mode }),
    updateType: (type: MemoryTypeValue, mode: MemoryConsentModeValue) =>
      api.patch<MemoryConsentSummaryDto>(`/memory/consents/${type}`, { mode }),
  },

  export: {
    create: () => api.post<MemoryExportJobDto>('/memory/export'),
    get: (jobId: string) => api.get<MemoryExportJobDto>(`/memory/export/${jobId}`),
  },

  intelligence: {
    recommendations: (params: { context?: string; limit?: number } = {}) =>
      api.get<RetrievalResultDto>(`/memory/recommendations${toQuery(params)}`),
    conflicts: () => api.get<MemoryConflictDto[]>('/memory/conflicts'),
    duplicates: () => api.get<MemoryDuplicatePairDto[]>('/memory/duplicates'),
    mergeSuggestions: {
      list: () => api.get<MergeSuggestionDto[]>('/memory/merge-suggestions'),
      accept: (id: string) => api.post<MergeSuggestionDto>(`/memory/merge-suggestions/${id}/accept`),
      reject: (id: string) => api.post<MergeSuggestionDto>(`/memory/merge-suggestions/${id}/reject`),
    },
  },
};
