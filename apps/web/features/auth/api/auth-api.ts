import type { SessionDto, UserDto } from '@beaconvie/types';
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

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export const authApi = {
  me: () => api.get<UserDto>('/auth/me', { skipRefreshRetry: false }),
  register: (payload: RegisterPayload) => api.post<UserDto>('/auth/register', payload),
  login: (payload: LoginPayload) => api.post<UserDto>('/auth/login', payload),
  logout: () => api.post<void>('/auth/logout'),
  forgotPassword: (email: string) => api.post<{ message: string }>('/auth/forgot-password', { email }),
  resetPassword: (payload: { token: string; password: string; confirmPassword: string }) =>
    api.post<{ message: string }>('/auth/reset-password', payload),
  verifyEmail: (token: string) => api.post<{ message: string }>('/auth/verify-email', { token }),
  resendVerification: (email: string) => api.post<{ message: string }>('/auth/resend-verification', { email }),
  changePassword: (payload: ChangePasswordPayload) => api.post<{ message: string }>('/auth/change-password', payload),
  sessions: () => api.get<SessionDto[]>('/auth/sessions'),
  revokeSession: (id: string) => api.delete<void>(`/auth/sessions/${id}`),
  logoutAll: () => api.post<void>('/auth/logout-all'),
};
