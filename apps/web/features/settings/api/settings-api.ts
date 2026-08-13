import type { AccountExportJobDto } from '@beaconvie/types';
import { api } from '@/lib/api-client';

export const settingsApi = {
  export: {
    create: () => api.post<AccountExportJobDto>('/users/me/export'),
    get: (jobId: string) => api.get<AccountExportJobDto>(`/users/me/export/${jobId}`),
  },
  deleteAccount: (password: string) => api.delete<void>('/users/me', { body: { password } }),
};
