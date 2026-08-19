import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithQuery } from '@/test/render-with-query';
import { AdminAiSpendPanel } from './admin-ai-spend-panel';
import { adminApi } from '../api/admin-api';

jest.mock('../api/admin-api', () => ({
  adminApi: { getAiSpend: jest.fn() },
}));

describe('AdminAiSpendPanel — error retry wiring', () => {
  it('shows an accessible loading status before data resolves', () => {
    (adminApi.getAiSpend as jest.Mock).mockReturnValue(new Promise(() => {}));
    renderWithQuery(<AdminAiSpendPanel />);
    expect(screen.getByRole('status')).toHaveTextContent(/loading ai spend/i);
  });

  it('renders a working retry button on error — regression for the confirmed missing-retry gap', async () => {
    (adminApi.getAiSpend as jest.Mock).mockRejectedValue(new Error('network blip'));
    const user = userEvent.setup();
    renderWithQuery(<AdminAiSpendPanel />);

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    const callsBeforeRetry = (adminApi.getAiSpend as jest.Mock).mock.calls.length;
    (adminApi.getAiSpend as jest.Mock).mockResolvedValue({ estimatedCostUsd: 0, requestCount: 0, failureCount: 0 });

    await user.click(screen.getByRole('button', { name: 'Try again' }));

    await waitFor(() => expect((adminApi.getAiSpend as jest.Mock).mock.calls.length).toBeGreaterThan(callsBeforeRetry));
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  });
});
