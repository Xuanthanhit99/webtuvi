import type { ListReadingsResultDto, TarotReadingDto, TarotReadingTypeValue, TarotSelectionSessionDto } from '@beaconvie/types';
import { api } from '@/lib/api-client';

export const tarotApi = {
  createSelectionSession: (type: TarotReadingTypeValue) => api.post<TarotSelectionSessionDto>('/tarot/selection-session', { type }),
  draw: (type: TarotReadingTypeValue, selectionToken: string, selectedPositions: number[], question?: string) =>
    api.post<TarotReadingDto>('/tarot/draw', { type, selectionToken, selectedPositions, question }),
  listReadings: () => api.get<ListReadingsResultDto>('/tarot/readings?status=ACTIVE&page=1&pageSize=20'),
  getReading: (id: string) => api.get<TarotReadingDto>(`/tarot/readings/${id}`),
};
