import type { ListReadingsResultDto, TarotCardDto, TarotReadingDto, TarotReadingHistoryDto, TarotReadingTypeValue, TarotSelectionSessionDto } from '@beaconvie/types';
import { api } from '@/lib/api-client';

export const tarotApi = {
  listDeck: () => api.get<TarotCardDto[]>('/tarot/deck'),
  createSelectionSession: (type: TarotReadingTypeValue) => api.post<TarotSelectionSessionDto>('/tarot/selection-session', { type }),
  draw: (type: TarotReadingTypeValue, selectionToken: string, selectedPositions: number[], question?: string) =>
    api.post<TarotReadingDto>('/tarot/draw', { type, selectionToken, selectedPositions, question }),
  listReadings: () => api.get<ListReadingsResultDto>('/tarot/readings?status=ACTIVE&page=1&pageSize=20'),
  getReading: (id: string) => api.get<TarotReadingDto>(`/tarot/readings/${id}`),
  readingHistory: (id: string) => api.get<TarotReadingHistoryDto[]>(`/tarot/readings/${id}/history`),
  retryInterpretation: (id: string) => api.post<TarotReadingDto>(`/tarot/readings/${id}/interpret`),
  archive: (id: string) => api.post<TarotReadingDto>(`/tarot/readings/${id}/archive`),
  restore: (id: string) => api.post<TarotReadingDto>(`/tarot/readings/${id}/restore`),
  remove: (id: string) => api.delete<TarotReadingDto>(`/tarot/readings/${id}`),
};
