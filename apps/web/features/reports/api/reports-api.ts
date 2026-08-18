import type { ListReportsResultDto, ReportDto, ReportReadinessDto } from '@beaconvie/types';
import { api } from '@/lib/api-client';

export interface ListReportsFilters {
  page?: number;
  pageSize?: number;
}

function toQuery(params: object): string {
  const search = new URLSearchParams();
  Object.entries(params as Record<string, string | number | undefined>).forEach(([key, value]) => {
    if (value !== undefined && value !== '') search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export const reportsApi = {
  readiness: () => api.get<ReportReadinessDto>('/reports/readiness'),
  generate: () => api.post<ReportDto>('/reports'),
  listReports: (filters: ListReportsFilters = {}) => api.get<ListReportsResultDto>(`/reports${toQuery(filters)}`),
  getReport: (id: string) => api.get<ReportDto>(`/reports/${id}`),
  regenerate: (id: string) => api.post<ReportDto>(`/reports/${id}/regenerate`),
};
