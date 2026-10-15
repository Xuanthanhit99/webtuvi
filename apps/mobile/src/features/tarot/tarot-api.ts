import { api, apiFetch } from '@/lib/api-client';

export type TarotSpread = 'DAILY_DRAW' | 'SINGLE_CARD' | 'THREE_CARD';
export type TarotStatus = 'ACTIVE' | 'ARCHIVED' | 'DELETED';

export interface TarotSelectionSession {
  token: string;
  expiresAt?: string;
  [key: string]: unknown;
}

export interface TarotCard {
  id?: string;
  slug?: string;
  name?: string;
  nameVi?: string;
  imageUrl?: string;
  uprightKeywords?: string[];
  reversedKeywords?: string[];
  uprightMeaning?: string;
  reversedMeaning?: string;
  loveMeaning?: string;
  careerMeaning?: string;
  financeMeaning?: string;
  selfMeaning?: string;
  reflectionPrompts?: string[];
  [key: string]: unknown;
}

export interface TarotReading {
  id: string;
  type: TarotSpread;
  status?: TarotStatus;
  createdAt?: string;
  cards: { position: number; positionLabel: string | null; isReversed: boolean; card: TarotCard }[];
  interpretation: string | null;
  spreadName?: string;
  question?: string | null;
  [key: string]: unknown;
}

export interface TarotReadingList {
  items: TarotReading[];
  total?: number;
  [key: string]: unknown;
}

function query(params: Record<string, string | number | undefined>): string {
  const search = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');
  return search ? `?${search}` : '';
}

export function requiredCardCount(type: TarotSpread): number {
  return type === 'THREE_CARD' ? 3 : 1;
}

export function validatePositions(type: TarotSpread, positions: number[]): void {
  if (positions.length !== requiredCardCount(type) || new Set(positions).size !== positions.length ||
      positions.some((position) => !Number.isInteger(position) || position < 0 || position > 77)) {
    throw new Error('Vị trí lá bài không hợp lệ. Vui lòng chọn lại.');
  }
}

export const tarotApi = {
  deck: () => api.get<TarotCard[]>('/tarot/deck'),
  card: (slug: string) => api.get<TarotCard>(`/tarot/deck/${encodeURIComponent(slug)}`),
  selectionSession: (type: TarotSpread) => api.post<TarotSelectionSession>('/tarot/selection-session', { type }),
  draw: (type: TarotSpread, selectionToken: string, selectedPositions: number[], question?: string) => {
    validatePositions(type, selectedPositions);
    if (!selectionToken || selectionToken.length < 20) throw new Error('Phiên xáo bài đã hết hạn. Hãy xáo lại.');
    return api.post<TarotReading>('/tarot/draw', { type, selectionToken, selectedPositions, ...(question?.trim() ? { question: question.trim() } : {}) });
  },
  readings: (status: TarotStatus = 'ACTIVE', page = 1) => api.get<TarotReadingList>(`/tarot/readings${query({ status, page })}`),
  reading: (id: string) => api.get<TarotReading>(`/tarot/readings/${encodeURIComponent(id)}`),
  history: (id: string) => api.get<unknown[]>(`/tarot/readings/${encodeURIComponent(id)}/history`),
  interpret: (id: string) => api.post<TarotReading>(`/tarot/readings/${encodeURIComponent(id)}/interpret`),
  archive: (id: string) => api.post<TarotReading>(`/tarot/readings/${encodeURIComponent(id)}/archive`),
  restore: (id: string) => api.post<TarotReading>(`/tarot/readings/${encodeURIComponent(id)}/restore`),
  remove: (id: string) => apiFetch<TarotReading>(`/tarot/readings/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};
