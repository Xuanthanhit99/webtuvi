import type {
  InsightCandidateDto,
  InsightCategoryValue,
  InsightStatisticsDto,
  InsightStatusValue,
  ListInsightsResultDto,
} from '@beaconvie/types';
import { api } from '@/lib/api-client';

export interface InsightFilters {
  category?: InsightCategoryValue;
  status?: InsightStatusValue;
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
};
