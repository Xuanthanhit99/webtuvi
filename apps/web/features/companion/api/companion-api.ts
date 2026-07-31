import type { CompanionMessageDto } from '@beaconvie/types';
import { api } from '@/lib/api-client';

export const companionApi = {
  getMessages: () => api.get<CompanionMessageDto[]>('/companion/messages'),
  sendMessage: (content: string) => api.post<CompanionMessageDto[]>('/companion/messages', { content }),
};
