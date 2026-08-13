import type { GeocodingSearchResultDto, ListNatalChartsResultDto, NatalChartDto, NatalChartHistoryDto } from '@beaconvie/types';
import { api } from '@/lib/api-client';

export interface ListChartsFilters {
  status?: 'ACTIVE' | 'ARCHIVED' | 'DELETED';
  page?: number;
  pageSize?: number;
}

export interface CreateNatalChartInput {
  birthDate: string;
  birthTime?: string;
  locationToken: string;
}

function toQuery(params: object): string {
  const search = new URLSearchParams();
  Object.entries(params as Record<string, string | number | boolean | undefined>).forEach(([key, value]) => {
    if (value !== undefined && value !== '') search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export const natalChartApi = {
  create: (input: CreateNatalChartInput) => api.post<NatalChartDto>('/natal-charts', input),
  listCharts: (filters: ListChartsFilters = {}) => api.get<ListNatalChartsResultDto>(`/natal-charts${toQuery(filters)}`),
  getChart: (id: string) => api.get<NatalChartDto>(`/natal-charts/${id}`),
  chartHistory: (id: string) => api.get<NatalChartHistoryDto[]>(`/natal-charts/${id}/history`),
  retryInterpretation: (id: string) => api.post<NatalChartDto>(`/natal-charts/${id}/interpret`),
  archiveChart: (id: string) => api.post<NatalChartDto>(`/natal-charts/${id}/archive`),
  restoreChart: (id: string) => api.post<NatalChartDto>(`/natal-charts/${id}/restore`),
  deleteChart: (id: string) => api.delete<NatalChartDto>(`/natal-charts/${id}`),
};

/** Server-side-only geocoding proxy — never called per-keystroke, only on an explicit user
 * search action (see `birth-input-form.tsx`). */
export const geocodingApi = {
  search: (query: string) => api.get<GeocodingSearchResultDto[]>(`/geocoding/search${toQuery({ q: query })}`),
};
