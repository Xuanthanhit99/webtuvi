import { screen, waitFor } from '@testing-library/react';
import { renderWithQuery as render } from '@/test/render-with-query';
import userEvent from '@testing-library/user-event';
import { ForgotPasswordForm } from './forgot-password-form';
import { ResetPasswordForm } from './reset-password-form';
import { authApi } from '../api/auth-api';
import { ApiError } from '@/lib/api-error';

const mockPush = jest.fn();
let mockParams = new URLSearchParams();
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }), useSearchParams: () => mockParams }));
jest.mock('../api/auth-api', () => ({ authApi: { forgotPassword: jest.fn(), resetPassword: jest.fn() } }));
beforeEach(() => { jest.clearAllMocks(); mockParams = new URLSearchParams(); });

it('keeps password recovery response generic after an accepted request', async () => {
  (authApi.forgotPassword as jest.Mock).mockResolvedValue({ message: 'accepted' });
  render(<ForgotPasswordForm />);
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Email'), 'unknown@example.test');
  await user.click(screen.getByRole('button', { name: 'Gửi liên kết đặt lại' }));
  expect(await screen.findByText(/Nếu có tài khoản dùng email này/)).toBeInTheDocument();
  expect(authApi.forgotPassword).toHaveBeenCalledWith('unknown@example.test');
});

it('does not infer reset success from a success query parameter or a missing token', () => {
  mockParams = new URLSearchParams('success=true');
  render(<ResetPasswordForm />);
  expect(screen.getByRole('link', { name: 'Yêu cầu liên kết mới' })).toHaveAttribute('href', '/forgot-password');
  expect(authApi.resetPassword).not.toHaveBeenCalled();
  expect(mockPush).not.toHaveBeenCalled();
});

it.each([true, false])('redirects only after real reset success (success=%s)', async (success) => {
  mockParams = new URLSearchParams('token=synthetic-reset-token');
  if (success) (authApi.resetPassword as jest.Mock).mockResolvedValue({ message: 'ok' });
  else (authApi.resetPassword as jest.Mock).mockRejectedValue(new ApiError('expired', 'RESET_TOKEN_EXPIRED', 400));
  render(<ResetPasswordForm />);
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Mật khẩu mới', { exact: true }), 'ValidPass1!');
  await user.type(screen.getByLabelText('Xác nhận mật khẩu mới'), 'ValidPass1!');
  await user.click(screen.getByRole('button', { name: 'Đặt lại mật khẩu' }));
  if (success) await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/login'));
  else {
    expect(await screen.findByText(/Liên kết không còn hiệu lực/)).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  }
  expect(authApi.resetPassword).toHaveBeenCalledWith({ token: 'synthetic-reset-token', password: 'ValidPass1!', confirmPassword: 'ValidPass1!' });
});
