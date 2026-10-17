import type { GeocodingSearchResultDto, ListNatalChartsResultDto, NatalChartDto, NatalChartHistoryDto } from '@beaconvie/types';
import { api } from '@/lib/api-client';
export interface NatalInput { birthDate: string; birthTime?: string; locationToken: string }
export interface NatalListFilters { status?: 'ACTIVE' | 'ARCHIVED' | 'DELETED'; page?: number; pageSize?: number }
function query(filters: NatalListFilters): string {
  const p = new URLSearchParams();
  if (filters.status) p.set('status', filters.status);
  if (filters.page !== undefined) p.set('page', String(filters.page));
  if (filters.pageSize !== undefined) p.set('pageSize', String(filters.pageSize));
  const s = p.toString(); return s ? '?' + s : '';
}
const path = (id: string) => '/natal-charts/' + encodeURIComponent(id);
export const natalChartApi = {
  searchLocation: (q: string) => api.get<GeocodingSearchResultDto[]>('/geocoding/search?q=' + encodeURIComponent(q)),
  create: (input: NatalInput) => api.post<NatalChartDto>('/natal-charts', input),
  list: (filters: NatalListFilters = {}) => api.get<ListNatalChartsResultDto>('/natal-charts' + query(filters)),
  get: (id: string) => api.get<NatalChartDto>(path(id)),
  history: (id: string) => api.get<NatalChartHistoryDto[]>(path(id) + '/history'),
  interpret: (id: string) => api.post<NatalChartDto>(path(id) + '/interpret'),
  archive: (id: string) => api.post<NatalChartDto>(path(id) + '/archive'),
  restore: (id: string) => api.post<NatalChartDto>(path(id) + '/restore'),
  remove: (id: string) => api.delete<NatalChartDto>(path(id)),
};
