import type { TuViChartDto, TuViChartHistoryDto, ListTuViChartsResultDto } from '@beaconvie/types';
import { api } from '@/lib/api-client';

export interface ListTuViChartsFilters {
  status?: 'ACTIVE' | 'ARCHIVED' | 'DELETED';
  page?: number;
  pageSize?: number;
}

export interface CalculateTuViChartInput {
  birthDate: string;
  birthTime: string;
  sex: 'Nam' | 'Nữ';
}

function toQuery(params: object): string {
  const search = new URLSearchParams();
  Object.entries(params as Record<string, string | number | boolean | undefined>).forEach(([key, value]) => {
    if (value !== undefined && value !== '') search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export const tuViApi = {
  calculate: (input: CalculateTuViChartInput) => api.post<TuViChartDto>('/tu-vi/calculate', input),
  listCharts: (filters: ListTuViChartsFilters = {}) => api.get<ListTuViChartsResultDto>(`/tu-vi/charts${toQuery(filters)}`),
  getChart: (id: string) => api.get<TuViChartDto>(`/tu-vi/charts/${id}`),
  chartHistory: (id: string) => api.get<TuViChartHistoryDto[]>(`/tu-vi/charts/${id}/history`),
  retryInterpretation: (id: string) => api.post<TuViChartDto>(`/tu-vi/charts/${id}/interpret`),
  archiveChart: (id: string) => api.post<TuViChartDto>(`/tu-vi/charts/${id}/archive`),
  restoreChart: (id: string) => api.post<TuViChartDto>(`/tu-vi/charts/${id}/restore`),
  deleteChart: (id: string) => api.delete<TuViChartDto>(`/tu-vi/charts/${id}`),
};
