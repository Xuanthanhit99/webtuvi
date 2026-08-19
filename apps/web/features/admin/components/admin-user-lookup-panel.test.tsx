import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithQuery } from '@/test/render-with-query';
import { AdminUserLookupPanel } from './admin-user-lookup-panel';
import { adminApi } from '../api/admin-api';
import { ApiError } from '@/lib/api-error';

jest.mock('../api/admin-api', () => ({
  adminApi: { lookupUserByEmail: jest.fn(), lookupUserById: jest.fn() },
}));

async function search(user: ReturnType<typeof userEvent.setup>, value: string) {
  await user.type(screen.getByLabelText('Email or user id'), value);
  await user.click(screen.getByRole('button', { name: 'Search' }));
}

describe('AdminUserLookupPanel — error retry wiring', () => {
  it('renders a working retry button on a real lookup failure (non-404)', async () => {
    (adminApi.lookupUserByEmail as jest.Mock)
      .mockRejectedValueOnce(new ApiError('Something went wrong', 'INTERNAL_ERROR', 500))
      .mockResolvedValueOnce({
        id: 'u1',
        email: 'a@x.com',
        displayName: 'A',
        status: 'ACTIVE',
        role: 'USER',
        isPremium: false,
        createdAt: new Date().toISOString(),
        emailVerifiedAt: null,
        onboardingCompletedAt: null,
      });
    const user = userEvent.setup();
    renderWithQuery(<AdminUserLookupPanel />);

    await search(user, 'a@x.com');
    await waitFor(() => expect(screen.getByText('Lookup failed')).toBeInTheDocument());
    const retryButton = screen.getByRole('button', { name: 'Try again' });

    await user.click(retryButton);

    await waitFor(() => expect(adminApi.lookupUserByEmail).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.queryByText('Lookup failed')).not.toBeInTheDocument());
  });

  it('does not show a retry button for "no user found" (retrying the same search would just 404 again)', async () => {
    (adminApi.lookupUserByEmail as jest.Mock).mockRejectedValueOnce(new ApiError('Not found', 'NOT_FOUND', 404));
    const user = userEvent.setup();
    renderWithQuery(<AdminUserLookupPanel />);

    await search(user, 'nobody@x.com');

    await waitFor(() => expect(screen.getByText('No user found')).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
  });
});
