import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithQuery } from '@/test/render-with-query';
import { SessionsPanel } from './sessions-panel';
import { authApi } from '@/features/auth/api/auth-api';
import { useInvalidateAuth } from '@/providers/auth-provider';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('@/providers/auth-provider', () => ({
  useInvalidateAuth: jest.fn(() => jest.fn()),
}));

jest.mock('@/features/auth/api/auth-api', () => ({
  authApi: { sessions: jest.fn(), revokeSession: jest.fn(), logoutAll: jest.fn() },
}));

const sessions = [
  { id: 'session-1', createdAt: '2026-01-01T00:00:00.000Z', lastUsedAt: '2026-01-02T00:00:00.000Z', current: true, userAgentSummary: 'Chrome on Windows' },
  { id: 'session-2', createdAt: '2026-01-01T00:00:00.000Z', lastUsedAt: '2026-01-01T00:00:00.000Z', current: false, userAgentSummary: 'Safari on iOS' },
];

describe('SessionsPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows a loading skeleton, then the session list with the current device labeled', async () => {
    (authApi.sessions as jest.Mock).mockResolvedValue(sessions);
    renderWithQuery(<SessionsPanel />);

    expect(await screen.findByText('Chrome on Windows')).toBeInTheDocument();
    expect(screen.getByText('This device')).toBeInTheDocument();
    expect(screen.getByText('Safari on iOS')).toBeInTheDocument();
  });

  it('shows an empty state when there are no sessions', async () => {
    (authApi.sessions as jest.Mock).mockResolvedValue([]);
    renderWithQuery(<SessionsPanel />);

    expect(await screen.findByText(/no active sessions/i)).toBeInTheDocument();
  });

  it('shows an error state with retry on load failure', async () => {
    (authApi.sessions as jest.Mock).mockRejectedValue(new Error('boom'));
    renderWithQuery(<SessionsPanel />);

    expect(await screen.findByText(/couldn.t load your sessions/i)).toBeInTheDocument();
  });

  it('confirms before revoking a non-current session', async () => {
    (authApi.sessions as jest.Mock).mockResolvedValue(sessions);
    (authApi.revokeSession as jest.Mock).mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderWithQuery(<SessionsPanel />);

    await screen.findByText('Safari on iOS');
    await user.click(screen.getByRole('button', { name: /sign out safari on ios/i }));

    expect(await screen.findByRole('heading', { name: /sign out that device/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Sign out' }));

    await waitFor(() => expect(authApi.revokeSession).toHaveBeenCalledWith('session-2'));
  });

  it('redirects to login and invalidates auth when revoking the current session', async () => {
    const invalidate = jest.fn();
    (useInvalidateAuth as jest.Mock).mockReturnValue(invalidate);
    (authApi.sessions as jest.Mock).mockResolvedValue(sessions);
    (authApi.revokeSession as jest.Mock).mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderWithQuery(<SessionsPanel />);

    await screen.findByText('Chrome on Windows');
    await user.click(screen.getByRole('button', { name: /sign out chrome on windows \(this device\)/i }));
    await user.click(await screen.findByRole('button', { name: 'Sign out' }));

    await waitFor(() => expect(invalidate).toHaveBeenCalled());
  });

  it('confirms before signing out of every device', async () => {
    (authApi.sessions as jest.Mock).mockResolvedValue(sessions);
    (authApi.logoutAll as jest.Mock).mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderWithQuery(<SessionsPanel />);

    await screen.findByText('Chrome on Windows');
    await user.click(screen.getByRole('button', { name: /sign out all/i }));

    expect(await screen.findByRole('heading', { name: /sign out of every device/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /sign out everywhere/i }));

    await waitFor(() => expect(authApi.logoutAll).toHaveBeenCalled());
  });
});
