import type { ListTuViChartsResultDto, TuViChartDto, TuViChartHistoryDto } from '@beaconvie/types';
import { api } from '@/lib/api-client';

export type TuViStatus = 'ACTIVE' | 'ARCHIVED' | 'DELETED';
export interface CalculateTuViInput {
  birthDate: string;
  birthTime: string;
  sex: 'Nam' | 'Nữ';
}
export interface ListTuViOptions {
  status?: TuViStatus;
  page?: number;
  pageSize?: number;
}
function chartPath(id: string): string {
  return `/tu-vi/charts/${encodeURIComponent(id)}`;
}
export const tuViApi = {
  calculate: (input: CalculateTuViInput) => api.post<TuViChartDto>('/tu-vi/calculate', input),
  list: (options: ListTuViOptions = {}) => {
    const params = new URLSearchParams();
    if (options.status) params.set('status', options.status);
    if (options.page !== undefined) params.set('page', String(options.page));
    if (options.pageSize !== undefined) params.set('pageSize', String(options.pageSize));
    const query = params.toString();
    return api.get<ListTuViChartsResultDto>(`/tu-vi/charts${query ? `?${query}` : ''}`);
  },
  get: (id: string) => api.get<TuViChartDto>(chartPath(id)),
  history: (id: string) => api.get<TuViChartHistoryDto[]>(`${chartPath(id)}/history`),
  interpret: (id: string) => api.post<TuViChartDto>(`${chartPath(id)}/interpret`),
  archive: (id: string) => api.post<TuViChartDto>(`${chartPath(id)}/archive`),
  restore: (id: string) => api.post<TuViChartDto>(`${chartPath(id)}/restore`),
  remove: (id: string) => api.delete<TuViChartDto>(chartPath(id)),
};
