import type {
  InsightCandidateDto,
  InsightCardDto,
  InsightCategoryValue,
  InsightEvidenceCardDto,
  InsightPriorityTierValue,
  InsightStatisticsDto,
  InsightStatusValue,
  InsightTimelineGroupByValue,
  InsightTimelineRangeValue,
  InsightTimelineResultDto,
  ListInsightCardsResultDto,
  ListInsightsResultDto,
  ReflectionSourceTypeValue,
} from '@beaconvie/types';
import { api } from '@/lib/api-client';

export interface InsightFilters {
  category?: InsightCategoryValue;
  status?: InsightStatusValue;
}

export interface InsightCardFilters {
  category?: InsightCategoryValue;
  status?: InsightStatusValue;
  priorityTier?: InsightPriorityTierValue;
  source?: ReflectionSourceTypeValue;
  pinned?: boolean;
  from?: string;
  to?: string;
  sort?: 'priority' | 'recent';
  page?: number;
  pageSize?: number;
}

export interface InsightTimelineFilters {
  range?: InsightTimelineRangeValue;
  from?: string;
  to?: string;
  groupBy?: InsightTimelineGroupByValue;
  category?: InsightCategoryValue;
}

function toQuery(params: object): string {
  const search = new URLSearchParams();
  Object.entries(params as Record<string, string | number | boolean | undefined>).forEach(([key, value]) => {
    if (value !== undefined && value !== '') search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export const insightApi = {
  list: (filters: InsightFilters & { page?: number; pageSize?: number } = {}) =>
    api.get<ListInsightsResultDto>(`/insight-candidates${toQuery(filters)}`),
  statistics: () => api.get<InsightStatisticsDto>('/insight-candidates/statistics'),
  get: (id: string) => api.get<InsightCandidateDto>(`/insight-candidates/${id}`),
  archive: (id: string) => api.post<InsightCandidateDto>(`/insight-candidates/${id}/archive`),

  // Insight Experience (Sprint 5A)
  cards: (filters: InsightCardFilters = {}) => api.get<ListInsightCardsResultDto>(`/insight-candidates/cards${toQuery(filters)}`),
  card: (id: string) => api.get<InsightCardDto>(`/insight-candidates/${id}/card`),
  timeline: (filters: InsightTimelineFilters = {}) => api.get<InsightTimelineResultDto>(`/insight-candidates/timeline${toQuery(filters)}`),
  evidence: (id: string) => api.get<InsightEvidenceCardDto[]>(`/insight-candidates/${id}/evidence`),
  pin: (id: string) => api.post<InsightCardDto>(`/insight-candidates/${id}/pin`),
  unpin: (id: string) => api.post<InsightCardDto>(`/insight-candidates/${id}/unpin`),
};
