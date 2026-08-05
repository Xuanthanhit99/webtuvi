import type {
  ReflectionCandidateDto,
  ReflectionCategoryValue,
  ReflectionGroupDto,
  ReflectionSortValue,
  ReflectionStateValue,
  ReflectionStatisticsDto,
  ReflectionTimelineResultDto,
  ReflectionTriggerValue,
  ListReflectionsResultDto,
} from '@beaconvie/types';
import { api } from '@/lib/api-client';

export interface ReflectionFilters {
  category?: ReflectionCategoryValue;
  trigger?: ReflectionTriggerValue;
  state?: Exclude<ReflectionStateValue, 'NEW'>;
  sort?: ReflectionSortValue;
}

function toQuery(params: object): string {
  const search = new URLSearchParams();
  Object.entries(params as Record<string, string | number | boolean | undefined>).forEach(([key, value]) => {
    if (value !== undefined && value !== '') search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export const reflectionApi = {
  list: (filters: ReflectionFilters & { page?: number; pageSize?: number } = {}) =>
    api.get<ListReflectionsResultDto>(`/reflections${toQuery(filters)}`),
  feed: (limit?: number) => api.get<ReflectionCandidateDto[]>(`/reflections/feed${toQuery({ limit })}`),
  timeline: (params: { from?: string; to?: string; category?: ReflectionCategoryValue; sort?: ReflectionSortValue } = {}) =>
    api.get<ReflectionTimelineResultDto>(`/reflections/timeline${toQuery(params)}`),
  groups: () => api.get<ReflectionGroupDto[]>('/reflections/groups'),
  statistics: () => api.get<ReflectionStatisticsDto>('/reflections/statistics'),
  get: (id: string) => api.get<ReflectionCandidateDto>(`/reflections/${id}`),
  archive: (id: string) => api.post<ReflectionCandidateDto>(`/reflections/${id}/archive`),
  dismiss: (id: string) => api.post<ReflectionCandidateDto>(`/reflections/${id}/dismiss`),
};
