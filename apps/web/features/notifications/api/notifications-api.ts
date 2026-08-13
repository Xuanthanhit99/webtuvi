import type { ListNotificationsResultDto, NotificationDto, NotificationPreferencesDto } from '@beaconvie/types';
import { api } from '@/lib/api-client';

export interface ListNotificationsParams {
  page?: number;
  pageSize?: number;
  unreadOnly?: boolean;
}

function toQueryString(params: ListNotificationsParams): string {
  const search = new URLSearchParams();
  if (params.page) search.set('page', String(params.page));
  if (params.pageSize) search.set('pageSize', String(params.pageSize));
  if (params.unreadOnly) search.set('unreadOnly', 'true');
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export const notificationsApi = {
  list: (params: ListNotificationsParams = {}) => api.get<ListNotificationsResultDto>(`/notifications${toQueryString(params)}`),
  unreadCount: () => api.get<{ count: number }>('/notifications/unread-count'),
  markRead: (id: string) => api.post<NotificationDto>(`/notifications/${id}/read`),
  markAllRead: () => api.post<{ updatedCount: number }>('/notifications/read-all'),
  getPreferences: () => api.get<NotificationPreferencesDto>('/notifications/preferences'),
  updatePreferences: (patch: Partial<NotificationPreferencesDto>) => api.patch<NotificationPreferencesDto>('/notifications/preferences', patch),
};
