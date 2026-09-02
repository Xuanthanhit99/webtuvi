import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useAuth } from '@/providers/auth-provider';

export type HomeDataState =
  | { kind: 'guest' }
  | { kind: 'loading' }
  | { kind: 'error'; retry: () => void }
  | { kind: 'empty' }
  | { kind: 'ok'; hasChart: boolean };

interface DashboardSummary {
  hasChart: boolean;
}

/**
 * Home's authenticated data. Real path (`status === 'authenticated'` via a real stored session)
 * calls `GET /dashboard`, same endpoint apps/web/features/dashboard/components/dashboard-view.tsx
 * uses — but this can never succeed today since no mobile-compatible auth endpoint exists yet
 * (see lib/auth/session-client.ts). The `devFixture` branch is the only way to visually validate
 * Loading/Empty/Error/Authenticated in this build; it never runs in a production build (`__DEV__`
 * is compiled out).
 */
export function useHomeData(): HomeDataState {
  const { status, devFixture } = useAuth();

  const query = useQuery({
    queryKey: ['home', 'dashboard'],
    queryFn: () => api.get<DashboardSummary>('/dashboard'),
    enabled: status === 'authenticated' && devFixture === 'off',
  });

  if (status === 'guest') return { kind: 'guest' };
  if (status === 'loading') return { kind: 'loading' };

  if (__DEV__ && devFixture !== 'off') {
    if (devFixture === 'authenticated-loading') return { kind: 'loading' };
    if (devFixture === 'authenticated-error') return { kind: 'error', retry: () => undefined };
    if (devFixture === 'authenticated-empty') return { kind: 'empty' };
    return { kind: 'ok', hasChart: true };
  }

  if (query.isLoading) return { kind: 'loading' };
  if (query.isError) return { kind: 'error', retry: () => query.refetch() };
  if (!query.data) return { kind: 'empty' };
  return { kind: 'ok', hasChart: query.data.hasChart };
}
