import type { ListNumerologyReadingsResultDto, NumerologyMeaningDto, NumerologyReadingDto, NumerologyReadingHistoryDto } from '@beaconvie/types';
import { api } from '@/lib/api-client';
export interface NumerologyListFilters { status?: 'ACTIVE' | 'ARCHIVED' | 'DELETED'; page?: number; pageSize?: number }
function query(filters: NumerologyListFilters): string {
  const p = new URLSearchParams();
  if (filters.status) p.set('status', filters.status);
  if (filters.page !== undefined) p.set('page', String(filters.page));
  if (filters.pageSize !== undefined) p.set('pageSize', String(filters.pageSize));
  const s = p.toString(); return s ? '?' + s : '';
}
const path = (id: string) => '/numerology/readings/' + encodeURIComponent(id);
export const numerologyApi = {
  calculate: (fullBirthName: string, birthDate: string) => api.post<NumerologyReadingDto>('/numerology/calculate', { fullBirthName, birthDate }),
  list: (filters: NumerologyListFilters = {}) => api.get<ListNumerologyReadingsResultDto>('/numerology/readings' + query(filters)),
  get: (id: string) => api.get<NumerologyReadingDto>(path(id)),
  history: (id: string) => api.get<NumerologyReadingHistoryDto[]>(path(id) + '/history'),
  interpret: (id: string) => api.post<NumerologyReadingDto>(path(id) + '/interpret'),
  archive: (id: string) => api.post<NumerologyReadingDto>(path(id) + '/archive'),
  restore: (id: string) => api.post<NumerologyReadingDto>(path(id) + '/restore'),
  remove: (id: string) => api.delete<NumerologyReadingDto>(path(id)),
  meanings: () => api.get<NumerologyMeaningDto[]>('/numerology/meanings'),
};
