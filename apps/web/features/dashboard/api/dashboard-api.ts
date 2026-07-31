import type { DashboardViewModelDto } from '@beaconvie/types';
import { api } from '@/lib/api-client';

export const dashboardApi = {
  get: () => api.get<DashboardViewModelDto>('/dashboard'),
};
