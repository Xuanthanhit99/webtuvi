'use client';

import { createContext, useContext, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { UserDto } from '@beaconvie/types';
import { authApi } from '@/features/auth/api/auth-api';
import { ApiError } from '@/lib/api-error';
import { clearAccountCache } from '@/lib/account-cache';
import { authReturnUrl, safeNextPath } from '@/lib/safe-next-path';

interface AuthContextValue {
  user: UserDto | null;
  isLoading: boolean;
  refetch: () => Promise<unknown>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      try {
        return await authApi.me();
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) return null;
        throw error;
      }
    },
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (data && (window.location.pathname === '/login' || window.location.pathname === '/register')) {
      const next = new URLSearchParams(window.location.search).get('next');
      window.location.replace(data.onboardingCompletedAt ? safeNextPath(next) : authReturnUrl('/onboarding', next));
    }
  }, [data]);

  useEffect(() => {
    const expire = () => {
      if (!data) return;
      void clearAccountCache(queryClient).then(() => {
        window.location.assign(authReturnUrl('/login', `${window.location.pathname}${window.location.search}${window.location.hash}`));
      });
    };
    window.addEventListener('menhvi:session-expired', expire);
    return () => window.removeEventListener('menhvi:session-expired', expire);
  }, [data, queryClient]);

  return (
    <AuthContext.Provider value={{ user: data ?? null, isLoading, refetch: () => refetch() }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function useInvalidateAuth() {
  const queryClient = useQueryClient();
  return async (signedOut = false) => {
    await clearAccountCache(queryClient);
    if (!signedOut) await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
  };
}
