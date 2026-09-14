import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithQuery } from '@/test/render-with-query';
import { RegisterForm } from './register-form';
import { authApi } from '../api/auth-api';

const mockPush = jest.fn();
let mockNext = '';
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams({ next: mockNext }),
}));

jest.mock('../api/auth-api', () => ({
  authApi: { register: jest.fn() },
}));

/** Fills every field with valid values, then lets the caller override one. */
async function fillValidForm(
  user: ReturnType<typeof userEvent.setup>,
  overrides: { password?: string; confirmPassword?: string; skipTerms?: boolean } = {},
) {
  await user.type(screen.getByLabelText('Tên hiển thị'), 'Alex');
  await user.type(screen.getByLabelText('Email'), 'alex@example.com');
  await user.type(screen.getByLabelText('Mật khẩu', { exact: true }), overrides.password ?? 'Sup3r$ecretPass');
  await user.type(
    screen.getByLabelText('Xác nhận mật khẩu'),
    overrides.confirmPassword ?? overrides.password ?? 'Sup3r$ecretPass',
  );
  if (!overrides.skipTerms) {
    await user.click(screen.getByLabelText(/Tôi đồng ý với/));
  }
}

describe('RegisterForm password rules', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNext = '';
  });

  it('rejects a password shorter than 8 characters', async () => {
    const user = userEvent.setup();
    renderWithQuery(<RegisterForm />);

    await fillValidForm(user, { password: 'Ab1!', confirmPassword: 'Ab1!' });
    await user.click(screen.getByRole('button', { name: 'Tạo tài khoản' }));

    // Same collision risk as above: match the error's exact wording, since the
    // permanent hint also contains "at least 8 characters".
    expect(await screen.findByText(/Mật khẩu cần ít nhất 8 ký tự/i)).toBeInTheDocument();
    expect(authApi.register).not.toHaveBeenCalled();
  });

  it('rejects a password with no number or symbol', async () => {
    const user = userEvent.setup();
    renderWithQuery(<RegisterForm />);

    await fillValidForm(user, { password: 'alllowercaseletters', confirmPassword: 'alllowercaseletters' });
    await user.click(screen.getByRole('button', { name: 'Tạo tài khoản' }));

    // The permanent password-rules hint also contains "number or symbol", so
    // match the error's specific wording ("Mật khẩu cần ít nhất một chữ số hoặc ký hiệu") to
    // avoid an ambiguous multi-match.
    expect(await screen.findByText(/Mật khẩu cần ít nhất một chữ số hoặc ký hiệu/i)).toBeInTheDocument();
    expect(authApi.register).not.toHaveBeenCalled();
  });

  it('rejects a confirm-password that does not match', async () => {
    const user = userEvent.setup();
    renderWithQuery(<RegisterForm />);

    await fillValidForm(user, { password: 'Sup3r$ecretPass', confirmPassword: 'Different1!' });
    await user.click(screen.getByRole('button', { name: 'Tạo tài khoản' }));

    expect(await screen.findByText(/Mật khẩu xác nhận chưa khớp/i)).toBeInTheDocument();
    expect(authApi.register).not.toHaveBeenCalled();
  });

  it('requires accepting the terms checkbox', async () => {
    const user = userEvent.setup();
    renderWithQuery(<RegisterForm />);

    await fillValidForm(user, { skipTerms: true });
    await user.click(screen.getByRole('button', { name: 'Tạo tài khoản' }));

    expect(await screen.findByText(/Bạn cần đồng ý với Điều khoản/i)).toBeInTheDocument();
    expect(authApi.register).not.toHaveBeenCalled();
  });

  it('submits successfully with valid data', async () => {
    (authApi.register as jest.Mock).mockResolvedValue({ onboardingCompletedAt: null });
    const user = userEvent.setup();
    renderWithQuery(<RegisterForm />);

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Tạo tài khoản' }));

    await screen.findByRole('button', { name: 'Tạo tài khoản' });
    expect(authApi.register).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'alex@example.com', displayName: 'Alex' }),
    );
  });
});

it.each([['/premium', '/onboarding?next=%2Fpremium'], ['/\\example.invalid', '/onboarding']])('register safely forwards %s', async (next, expected) => {
  mockNext = next;
  (authApi.register as jest.Mock).mockResolvedValue({ onboardingCompletedAt: null });
  renderWithQuery(<RegisterForm />);
  const user = userEvent.setup();
  await fillValidForm(user);
  await user.click(screen.getByRole('button', { name: 'Tạo tài khoản' }));
  await waitFor(() => expect(mockPush).toHaveBeenLastCalledWith(expected));
});
