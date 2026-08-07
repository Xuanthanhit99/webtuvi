import type { ListReadingsResultDto, TarotCardDto, TarotReadingDto, TarotReadingHistoryDto, TarotReadingTypeValue } from '@beaconvie/types';
import { api } from '@/lib/api-client';

export interface ListDeckFilters {
  arcana?: 'MAJOR' | 'MINOR';
  suit?: 'WANDS' | 'CUPS' | 'SWORDS' | 'PENTACLES';
  category?: string;
  search?: string;
}

export interface ListReadingsFilters {
  status?: 'ACTIVE' | 'ARCHIVED' | 'DELETED';
  type?: TarotReadingTypeValue;
  search?: string;
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

export const tarotApi = {
  listDeck: (filters: ListDeckFilters = {}) => api.get<TarotCardDto[]>(`/tarot/deck${toQuery(filters)}`),
  getCard: (slug: string) => api.get<TarotCardDto>(`/tarot/deck/${slug}`),
  draw: (type: TarotReadingTypeValue, question?: string) => api.post<TarotReadingDto>('/tarot/draw', { type, question }),
  listReadings: (filters: ListReadingsFilters = {}) => api.get<ListReadingsResultDto>(`/tarot/readings${toQuery(filters)}`),
  getReading: (id: string) => api.get<TarotReadingDto>(`/tarot/readings/${id}`),
  readingHistory: (id: string) => api.get<TarotReadingHistoryDto[]>(`/tarot/readings/${id}/history`),
  retryInterpretation: (id: string) => api.post<TarotReadingDto>(`/tarot/readings/${id}/interpret`),
  archiveReading: (id: string) => api.post<TarotReadingDto>(`/tarot/readings/${id}/archive`),
  restoreReading: (id: string) => api.post<TarotReadingDto>(`/tarot/readings/${id}/restore`),
  deleteReading: (id: string) => api.delete<TarotReadingDto>(`/tarot/readings/${id}`),
};
