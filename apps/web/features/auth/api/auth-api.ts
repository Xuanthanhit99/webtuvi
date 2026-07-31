import type { UserDto } from '@beaconvie/types';
import { api } from '@/lib/api-client';

export interface RegisterPayload {
  email: string;
  displayName: string;
  password: string;
  confirmPassword: string;
  acceptedTerms: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const authApi = {
  me: () => api.get<UserDto>('/auth/me', { skipRefreshRetry: false }),
  register: (payload: RegisterPayload) => api.post<UserDto>('/auth/register', payload),
  login: (payload: LoginPayload) => api.post<UserDto>('/auth/login', payload),
  logout: () => api.post<void>('/auth/logout'),
  forgotPassword: (email: string) => api.post<{ message: string }>('/auth/forgot-password', { email }),
  resetPassword: (payload: { token: string; password: string; confirmPassword: string }) =>
    api.post<{ message: string }>('/auth/reset-password', payload),
};
