import type { MobileAuthResponseDto, UserDto } from '@beaconvie/types';
import { api } from '../api-client';

/**
 * Mirrors apps/web/features/auth/api/auth-api.ts's field names exactly — these are not invented,
 * they're the literal `RegisterDto`/`LoginDto` validation shape from apps/api/src/auth/dto/*.
 * Calls the /auth/mobile/* endpoints (tokens in the body) instead of the cookie-setting web
 * routes — see apps/api/src/auth/auth.controller.ts's mobile* handlers.
 */
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
  register: (payload: RegisterPayload) => api.post<MobileAuthResponseDto>('/auth/mobile/register', payload),
  login: (payload: LoginPayload) => api.post<MobileAuthResponseDto>('/auth/mobile/login', payload),
  me: () => api.get<UserDto>('/auth/me'),
  forgotPassword: (email: string) => api.post<{ message: string }>('/auth/forgot-password', { email }),
  resendVerification: (email: string) => api.post<{ message: string }>('/auth/resend-verification', { email }),
};
