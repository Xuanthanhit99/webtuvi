import type {
  ListNumerologyReadingsResultDto,
  NumerologyMeaningDto,
  NumerologyReadingDto,
  NumerologyReadingHistoryDto,
} from '@beaconvie/types';
import { api } from '@/lib/api-client';

export interface ListReadingsFilters {
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

export const numerologyApi = {
  calculate: (fullBirthName: string, birthDate: string) => api.post<NumerologyReadingDto>('/numerology/calculate', { fullBirthName, birthDate }),
  listReadings: (filters: ListReadingsFilters = {}) => api.get<ListNumerologyReadingsResultDto>(`/numerology/readings${toQuery(filters)}`),
  getReading: (id: string) => api.get<NumerologyReadingDto>(`/numerology/readings/${id}`),
  readingHistory: (id: string) => api.get<NumerologyReadingHistoryDto[]>(`/numerology/readings/${id}/history`),
  retryInterpretation: (id: string) => api.post<NumerologyReadingDto>(`/numerology/readings/${id}/interpret`),
  archiveReading: (id: string) => api.post<NumerologyReadingDto>(`/numerology/readings/${id}/archive`),
  restoreReading: (id: string) => api.post<NumerologyReadingDto>(`/numerology/readings/${id}/restore`),
  deleteReading: (id: string) => api.delete<NumerologyReadingDto>(`/numerology/readings/${id}`),
  listMeanings: () => api.get<NumerologyMeaningDto[]>('/numerology/meanings'),
};
