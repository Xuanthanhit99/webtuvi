import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResendVerificationForm } from './resend-verification-form';
import { authApi } from '../api/auth-api';

jest.mock('../api/auth-api', () => ({
  authApi: { resendVerification: jest.fn() },
}));

describe('ResendVerificationForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers({ advanceTimers: true });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows a validation error and never calls the API for an invalid email', async () => {
    const user = userEvent.setup({ delay: null });
    render(<ResendVerificationForm />);

    await user.click(screen.getByRole('button', { name: /send verification link/i }));

    expect(await screen.findByText(/valid email/i)).toBeInTheDocument();
    expect(authApi.resendVerification).not.toHaveBeenCalled();
  });

  it('sends the request, shows a generic success message, and starts a cooldown that disables resubmission', async () => {
    (authApi.resendVerification as jest.Mock).mockResolvedValue({ message: 'ok' });
    const user = userEvent.setup({ delay: null });
    render(<ResendVerificationForm />);

    await user.type(screen.getByLabelText('Email'), 'alex@example.com');
    await user.click(screen.getByRole('button', { name: /send verification link/i }));

    expect(await screen.findByText(/check your email/i)).toBeInTheDocument();
    expect(authApi.resendVerification).toHaveBeenCalledWith('alex@example.com');

    const button = await screen.findByRole('button', { name: /resend available in/i });
    expect(button).toBeDisabled();
  });

  it('shows a friendly error on network failure', async () => {
    (authApi.resendVerification as jest.Mock).mockRejectedValue(new Error('network down'));
    const user = userEvent.setup({ delay: null });
    render(<ResendVerificationForm />);

    await user.type(screen.getByLabelText('Email'), 'alex@example.com');
    await user.click(screen.getByRole('button', { name: /send verification link/i }));

    await waitFor(() => expect(screen.getByText(/something went wrong/i)).toBeInTheDocument());
  });
});
