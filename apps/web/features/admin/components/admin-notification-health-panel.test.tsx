import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithQuery } from '@/test/render-with-query';
import { AdminNotificationHealthPanel } from './admin-notification-health-panel';
import { adminApi } from '../api/admin-api';

jest.mock('../api/admin-api', () => ({
  adminApi: { getNotificationHealth: jest.fn() },
}));

describe('AdminNotificationHealthPanel — error retry wiring', () => {
  it('shows an accessible loading status before data resolves', () => {
    (adminApi.getNotificationHealth as jest.Mock).mockReturnValue(new Promise(() => {}));
    renderWithQuery(<AdminNotificationHealthPanel />);
    expect(screen.getByRole('status')).toHaveTextContent(/loading notification health/i);
  });

  it('renders a working retry button on error — regression for the confirmed missing-retry gap', async () => {
    (adminApi.getNotificationHealth as jest.Mock).mockRejectedValue(new Error('network blip'));
    const user = userEvent.setup();
    renderWithQuery(<AdminNotificationHealthPanel />);

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    const callsBeforeRetry = (adminApi.getNotificationHealth as jest.Mock).mock.calls.length;
    (adminApi.getNotificationHealth as jest.Mock).mockResolvedValue({ last24h: [], last7d: [] });

    await user.click(screen.getByRole('button', { name: 'Try again' }));

    await waitFor(() => expect((adminApi.getNotificationHealth as jest.Mock).mock.calls.length).toBeGreaterThan(callsBeforeRetry));
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  });
});
