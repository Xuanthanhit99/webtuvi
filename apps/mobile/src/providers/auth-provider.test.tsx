import { render, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import { AuthProvider, useAuth } from './auth-provider';
import { ApiError } from '@/lib/api-client';
import * as sessionClient from '@/lib/auth/session-client';
import { authApi } from '@/lib/auth/auth-api';

jest.mock('@/lib/auth/session-client');
jest.mock('@/lib/auth/auth-api');
jest.mock('@/lib/query-client', () => ({ queryClient: { clear: jest.fn() } }));

const mockedSessionClient = sessionClient as jest.Mocked<typeof sessionClient>;
const mockedAuthApi = authApi as jest.Mocked<typeof authApi>;

function makeUser(overrides: Partial<{ email: string; displayName: string }> = {}) {
  return {
    id: '1',
    email: overrides.email ?? 'user@example.com',
    displayName: overrides.displayName ?? 'User',
    emailVerifiedAt: null,
    onboardingCompletedAt: null,
    createdAt: new Date().toISOString(),
    role: 'USER' as const,
  };
}

function Probe() {
  const { status, user, devFixture } = useAuth();
  return <Text testID="probe">{JSON.stringify({ status, user, devFixture })}</Text>;
}

function readProbe(getByTestId: (id: string) => { props: { children: string } }) {
  return JSON.parse(getByTestId('probe').props.children);
}

describe('AuthProvider — real bootstrap', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('defaults devFixture to "off" and resolves guest when no session is stored', async () => {
    mockedSessionClient.getStoredSession.mockResolvedValue(null);

    const { getByTestId } = await render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() => {
      const state = readProbe(getByTestId);
      expect(state.status).toBe('guest');
      expect(state.devFixture).toBe('off');
      expect(state.user).toBeNull();
    });
    expect(mockedAuthApi.me).not.toHaveBeenCalled();
  });

  it('resolves authenticated with the real profile when the stored session validates against /auth/me', async () => {
    mockedSessionClient.getStoredSession.mockResolvedValue({ accessToken: 'a', refreshToken: 'b' });
    mockedAuthApi.me.mockResolvedValue(makeUser({ email: 'real@example.com' }));

    const { getByTestId } = await render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() => {
      const state = readProbe(getByTestId);
      expect(state.status).toBe('authenticated');
      expect(state.user.email).toBe('real@example.com');
    });
    expect(mockedSessionClient.setCachedUser).toHaveBeenCalled();
  });

  it('treats a 401 from /auth/me as guest — the credential is genuinely invalid, not offline', async () => {
    mockedSessionClient.getStoredSession.mockResolvedValue({ accessToken: 'a', refreshToken: 'b' });
    mockedAuthApi.me.mockRejectedValue(new ApiError('Session expired', 'SESSION_EXPIRED', 401));

    const { getByTestId } = await render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(readProbe(getByTestId).status).toBe('guest');
    });
  });

  it('keeps the user authenticated (using the cached profile) on a network error at boot — offline is not logged out', async () => {
    mockedSessionClient.getStoredSession.mockResolvedValue({ accessToken: 'a', refreshToken: 'b' });
    mockedSessionClient.getCachedUser.mockResolvedValue(makeUser({ email: 'cached@example.com' }));
    mockedAuthApi.me.mockRejectedValue(new TypeError('Network request failed'));

    const { getByTestId } = await render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() => {
      const state = readProbe(getByTestId);
      expect(state.status).toBe('authenticated');
      expect(state.user.email).toBe('cached@example.com');
    });
  });
});
