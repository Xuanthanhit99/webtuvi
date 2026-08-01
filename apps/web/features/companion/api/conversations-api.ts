import type { ConversationDetailDto, ConversationDto, SendConversationMessageResultDto } from '@beaconvie/types';
import { api } from '@/lib/api-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export const conversationsApi = {
  list: () => api.get<ConversationDto[]>('/companion/conversations'),
  create: (title?: string) => api.post<ConversationDto>('/companion/conversations', { title }),
  get: (id: string) => api.get<ConversationDetailDto>(`/companion/conversations/${id}`),
  sendMessage: (id: string, content: string) =>
    api.post<SendConversationMessageResultDto>(`/companion/conversations/${id}/messages`, { content }),
  delete: (id: string) => api.delete<void>(`/companion/conversations/${id}`),
  /** GET, not a fetch wrapper — the frontend opens this directly with a native EventSource (SSE, not WebSocket). */
  streamUrl: (id: string) => `${API_URL}/companion/conversations/${id}/messages/stream`,
};
