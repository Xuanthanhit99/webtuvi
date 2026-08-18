import type { EasternHoroscopeProfileDto, EasternHoroscopeProfileHistoryDto, ListEasternHoroscopeProfilesResultDto } from '@beaconvie/types';
import { api } from '@/lib/api-client';

export interface ListProfilesFilters {
  status?: 'ACTIVE' | 'ARCHIVED' | 'DELETED';
  page?: number;
  pageSize?: number;
}

function toQuery(params: object): string {
  const search = new URLSearchParams();
  Object.entries(params as Record<string, string | number | boolean | undefined>).forEach(([key, value]) => {
    if (value !== undefined && value !== '') search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export const easternHoroscopeApi = {
  calculate: (birthDate: string) => api.post<EasternHoroscopeProfileDto>('/eastern-horoscope/calculate', { birthDate }),
  listProfiles: (filters: ListProfilesFilters = {}) => api.get<ListEasternHoroscopeProfilesResultDto>(`/eastern-horoscope/profiles${toQuery(filters)}`),
  getProfile: (id: string) => api.get<EasternHoroscopeProfileDto>(`/eastern-horoscope/profiles/${id}`),
  profileHistory: (id: string) => api.get<EasternHoroscopeProfileHistoryDto[]>(`/eastern-horoscope/profiles/${id}/history`),
  retryInterpretation: (id: string) => api.post<EasternHoroscopeProfileDto>(`/eastern-horoscope/profiles/${id}/interpret`),
  archiveProfile: (id: string) => api.post<EasternHoroscopeProfileDto>(`/eastern-horoscope/profiles/${id}/archive`),
  restoreProfile: (id: string) => api.post<EasternHoroscopeProfileDto>(`/eastern-horoscope/profiles/${id}/restore`),
  deleteProfile: (id: string) => api.delete<EasternHoroscopeProfileDto>(`/eastern-horoscope/profiles/${id}`),
};
