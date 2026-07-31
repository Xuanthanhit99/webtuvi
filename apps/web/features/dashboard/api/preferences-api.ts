import type { UserPreferenceDto } from '@beaconvie/types';
import { api } from '@/lib/api-client';

export const preferencesApi = {
  get: () => api.get<UserPreferenceDto>('/users/me/preferences'),
  update: (patch: Partial<UserPreferenceDto>) => api.patch<UserPreferenceDto>('/users/me/preferences', patch),
};
