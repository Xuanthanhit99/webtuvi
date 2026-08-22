import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithQuery } from '@/test/render-with-query';
import { LoginForm } from './login-form';
import { authApi } from '../api/auth-api';
import { ApiError } from '@/lib/api-error';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock('../api/auth-api', () => ({
  authApi: { login: jest.fn() },
}));

describe('LoginForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows validation errors and never calls the API when the form is empty', async () => {
    const user = userEvent.setup();
    renderWithQuery(<LoginForm />);

    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByText(/valid email/i)).toBeInTheDocument();
    expect(await screen.findByText(/enter your password/i)).toBeInTheDocument();
    expect(authApi.login).not.toHaveBeenCalled();
  });

  it('shows a disabled, loading submit button while the request is in flight', async () => {
    let resolveLogin!: () => void;
    (authApi.login as jest.Mock).mockReturnValue(
      new Promise((resolve) => {
        resolveLogin = () => resolve({ onboardingCompletedAt: null });
      }),
    );

    const user = userEvent.setup();
    renderWithQuery(<LoginForm />);

    await user.type(screen.getByLabelText('Email'), 'alex@example.com');
    await user.type(screen.getByLabelText('Password', { exact: true }), 'Sup3r$ecretPass');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    const button = screen.getByRole('button', { name: 'Log in' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');

    resolveLogin();
    await waitFor(() => expect(authApi.login).toHaveBeenCalledTimes(1));
  });

  it('renders a friendly error message when the API rejects the credentials', async () => {
    (authApi.login as jest.Mock).mockRejectedValue(
      new ApiError('That password doesn’t match this account.', 'WRONG_PASSWORD', 401),
    );

    const user = userEvent.setup();
    renderWithQuery(<LoginForm />);

    await user.type(screen.getByLabelText('Email'), 'alex@example.com');
    await user.type(screen.getByLabelText('Password', { exact: true }), 'WrongPassword1!');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByText(/doesn.t match this account/i)).toBeInTheDocument();
  });
});
