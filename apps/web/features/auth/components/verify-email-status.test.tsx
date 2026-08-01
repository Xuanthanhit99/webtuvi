import { render, screen, waitFor } from '@testing-library/react';
import { VerifyEmailStatus } from './verify-email-status';
import { authApi } from '../api/auth-api';
import { ApiError } from '@/lib/api-error';

let mockSearchParams = new URLSearchParams();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  useSearchParams: () => mockSearchParams,
}));

jest.mock('../api/auth-api', () => ({
  authApi: { verifyEmail: jest.fn() },
}));

describe('VerifyEmailStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams = new URLSearchParams();
  });

  it('shows a message when the link has no token', () => {
    render(<VerifyEmailStatus />);
    expect(screen.getByText(/missing verification link/i)).toBeInTheDocument();
    expect(authApi.verifyEmail).not.toHaveBeenCalled();
  });

  it('shows success once the token verifies', async () => {
    mockSearchParams = new URLSearchParams('token=valid-token');
    (authApi.verifyEmail as jest.Mock).mockResolvedValue({ message: 'Your email has been verified.' });

    render(<VerifyEmailStatus />);

    expect(await screen.findByText(/email verified/i)).toBeInTheDocument();
    expect(authApi.verifyEmail).toHaveBeenCalledWith('valid-token');
  });

  it('shows an expired state distinct from an invalid one', async () => {
    mockSearchParams = new URLSearchParams('token=expired-token');
    (authApi.verifyEmail as jest.Mock).mockRejectedValue(
      new ApiError('This verification link has expired.', 'VERIFICATION_TOKEN_EXPIRED', 400),
    );

    render(<VerifyEmailStatus />);

    await waitFor(() => expect(screen.getByText(/this link has expired/i)).toBeInTheDocument());
  });

  it('shows an invalid-token state', async () => {
    mockSearchParams = new URLSearchParams('token=bad-token');
    (authApi.verifyEmail as jest.Mock).mockRejectedValue(
      new ApiError('This verification link is invalid.', 'VERIFICATION_TOKEN_INVALID', 400),
    );

    render(<VerifyEmailStatus />);

    await waitFor(() => expect(screen.getByText(/isn.t valid/i)).toBeInTheDocument());
  });

  it('shows a network-error state with a retry action on an unexpected failure', async () => {
    mockSearchParams = new URLSearchParams('token=any-token');
    (authApi.verifyEmail as jest.Mock).mockRejectedValue(new Error('fetch failed'));

    render(<VerifyEmailStatus />);

    expect(await screen.findByText(/couldn.t reach the server/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });
});
