import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithQuery } from '@/test/render-with-query';
import { LoginForm } from './login-form';
import { authApi } from '../api/auth-api';
import { ApiError } from '@/lib/api-error';

const mockPush = jest.fn();
let mockNext = '';
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams({ next: mockNext }),
}));

jest.mock('../api/auth-api', () => ({
  authApi: { login: jest.fn() },
}));

describe('LoginForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNext = '';
  });

  it('shows validation errors and never calls the API when the form is empty', async () => {
    const user = userEvent.setup();
    renderWithQuery(<LoginForm />);

    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }));

    expect(await screen.findByText(/email hợp lệ/i)).toBeInTheDocument();
    expect(await screen.findByText(/nhập mật khẩu/i)).toBeInTheDocument();
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
    await user.type(screen.getByLabelText('Mật khẩu', { exact: true }), 'Sup3r$ecretPass');
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }));

    const button = screen.getByRole('button', { name: 'Đăng nhập' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');

    resolveLogin();
    await waitFor(() => expect(authApi.login).toHaveBeenCalledTimes(1));
  });

  it('renders a friendly error message when the API rejects the credentials', async () => {
    (authApi.login as jest.Mock).mockRejectedValue(
      new ApiError('Mật khẩu xác nhận chưa khớp this account.', 'WRONG_PASSWORD', 401),
    );

    const user = userEvent.setup();
    renderWithQuery(<LoginForm />);

    await user.type(screen.getByLabelText('Email'), 'alex@example.com');
    await user.type(screen.getByLabelText('Mật khẩu', { exact: true }), 'WrongPassword1!');
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }));

    expect(await screen.findByText(/Email hoặc mật khẩu chưa đúng/i)).toBeInTheDocument();
  });
});

  it.each([
    ['/premium', true, '/premium'],
    ['/\\example.invalid', true, '/'],
    ['/discover/tarot?item=123', false, '/onboarding?next=%2Fdiscover%2Ftarot%3Fitem%3D123'],
    ['/\\example.invalid', false, '/onboarding'],
  ])('uses safe return intent %s (onboarded %s)', async (next, onboarded, expected) => {
    mockNext = next as string;
    (authApi.login as jest.Mock).mockResolvedValue({ onboardingCompletedAt: onboarded ? '2026-01-01' : null });
    renderWithQuery(<LoginForm />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Email'), 'alex@example.com');
    await user.type(screen.getByLabelText('Mật khẩu', { exact: true }), 'Sup3r$ecretPass');
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }));
    await waitFor(() => expect(mockPush).toHaveBeenLastCalledWith(expected));
  });
