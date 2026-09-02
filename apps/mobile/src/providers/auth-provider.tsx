import { createContext, useContext, useEffect, useMemo, useState, useCallback, type ReactNode } from 'react';
import type { UserDto } from '@beaconvie/types';
import { getStoredSession, setStoredSession, clearStoredSession, getCachedUser, setCachedUser, type StoredSession } from '@/lib/auth/session-client';
import { authApi, type LoginPayload, type RegisterPayload } from '@/lib/auth/auth-api';
import { ApiError } from '@/lib/api-client';
import { queryClient } from '@/lib/query-client';

export type AuthStatus = 'loading' | 'guest' | 'authenticated';

/**
 * Dev-only fixture states — a visual-QA tool for previewing Authenticated/Loading/Empty/Error Home
 * states without a real backend session, kept from Phase 01. `__DEV__`-gated: in a production
 * build `setDevFixture` is a no-op and `devFixture` can never leave `'off'`, so this can never
 * ship as fake auth. It sits BESIDE the real bootstrap logic below, not inside it — real auth
 * state is computed first and unconditionally; the fixture only overrides what's rendered.
 */
export type DevFixture = 'off' | 'authenticated-ok' | 'authenticated-empty' | 'authenticated-error' | 'authenticated-loading';

const DEV_FIXTURE_USER: UserDto = {
  id: 'dev-fixture-user',
  email: 'dev@menhvi.local',
  displayName: 'Lan Anh',
  emailVerifiedAt: new Date().toISOString(),
  onboardingCompletedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  role: 'USER',
};

interface AuthContextValue {
  status: AuthStatus;
  user: UserDto | null;
  devFixture: DevFixture;
  setDevFixture: (fixture: DevFixture) => void;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function establishSession(session: StoredSession): Promise<UserDto> {
  await setStoredSession(session);
  const user = await authApi.me();
  await setCachedUser(user);
  return user;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<UserDto | null>(null);
  const [devFixture, setDevFixtureState] = useState<DevFixture>('off');

  // Session restore — runs once on app start. A stored token pair is NEVER treated as proof of
  // being authenticated on its own (it could be expired/revoked since the app last ran); it's
  // always re-validated against the backend first. See lib/api-client.ts's apiFetch for the
  // single-flight refresh-on-401 this `me()` call rides on if the access token has expired.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const session = await getStoredSession();
      if (!session) {
        if (!cancelled) setStatus('guest');
        return;
      }
      try {
        const me = await authApi.me();
        if (cancelled) return;
        await setCachedUser(me);
        setUser(me);
        setStatus('authenticated');
      } catch (error) {
        if (cancelled) return;
        if (error instanceof ApiError && error.status === 401) {
          // apiFetch already tried one refresh-and-retry internally; a 401 reaching here means
          // that refresh concluded the credential is genuinely invalid, and api-client.ts has
          // already cleared it from storage in that case (not merely offline — see its
          // 'invalid' vs 'network-error' distinction).
          setStatus('guest');
          return;
        }
        // Anything else (network unreachable, 5xx, timeout) says nothing about whether the
        // stored credential is actually valid — do NOT log the user out over a temporary
        // connection loss. Fall back to the last successfully-fetched profile so Home can still
        // render real (if possibly stale) data instead of guest content or a fabricated user.
        const cached = await getCachedUser();
        setUser(cached);
        setStatus('authenticated');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const result = await authApi.login(payload);
    const me = await establishSession({ accessToken: result.accessToken, refreshToken: result.refreshToken });
    setUser(me);
    setStatus('authenticated');
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const result = await authApi.register(payload);
    const me = await establishSession({ accessToken: result.accessToken, refreshToken: result.refreshToken });
    setUser(me);
    setStatus('authenticated');
  }, []);

  const logout = useCallback(async () => {
    const session = await getStoredSession();
    if (session) {
      // Best-effort server-side revocation — proceed with clearing local state regardless of
      // whether this succeeds (e.g. offline logout should still log the device out locally).
      await fetch(`${process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000'}/auth/mobile/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: session.refreshToken }),
      }).catch(() => undefined);
    }
    await clearStoredSession();
    queryClient.clear();
    setUser(null);
    setStatus('guest');
  }, []);

  const setDevFixture = (fixture: DevFixture) => {
    if (!__DEV__) return;
    setDevFixtureState(fixture);
  };

  const effectiveStatus: AuthStatus = __DEV__ && devFixture !== 'off' ? 'authenticated' : status;
  const effectiveUser = __DEV__ && devFixture !== 'off' ? DEV_FIXTURE_USER : user;

  const value = useMemo<AuthContextValue>(
    () => ({
      status: effectiveStatus,
      user: effectiveUser,
      devFixture: __DEV__ ? devFixture : 'off',
      setDevFixture,
      login,
      register,
      logout,
    }),
    [effectiveStatus, effectiveUser, devFixture, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
