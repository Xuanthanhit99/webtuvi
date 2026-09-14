import { screen, waitFor } from '@testing-library/react';
import { renderWithQuery as render } from '@/test/render-with-query';
import userEvent from '@testing-library/user-event';
import { ChangePasswordForm } from './change-password-form';
import { authApi } from '@/features/auth/api/auth-api';
import { ApiError } from '@/lib/api-error';

jest.mock('@/features/auth/api/auth-api', () => ({
  authApi: { changePassword: jest.fn() },
}));

describe('ChangePasswordForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('validates before calling the API', async () => {
    const user = userEvent.setup();
    render(<ChangePasswordForm />);

    await user.click(screen.getByRole('button', { name: /Đổi mật khẩu/i }));

    expect(await screen.findByText(/nhập mật khẩu hiện tại/i)).toBeInTheDocument();
    expect(authApi.changePassword).not.toHaveBeenCalled();
  });

  it('submits and shows a success toast-worthy confirmation on success', async () => {
    (authApi.changePassword as jest.Mock).mockResolvedValue({ message: 'ok' });
    const user = userEvent.setup();
    render(<ChangePasswordForm />);

    await user.type(screen.getByLabelText('Mật khẩu hiện tại'), 'OldPass1!');
    await user.type(screen.getByLabelText('Mật khẩu mới'), 'NewPass1!');
    await user.type(screen.getByLabelText('Xác nhận mật khẩu mới'), 'NewPass1!');
    await user.click(screen.getByRole('button', { name: /Đổi mật khẩu/i }));

    await waitFor(() =>
      expect(authApi.changePassword).toHaveBeenCalledWith({
        currentPassword: 'OldPass1!',
        newPassword: 'NewPass1!',
        confirmNewPassword: 'NewPass1!',
      }),
    );
  });

  it('shows the server error when the current password is wrong', async () => {
    (authApi.changePassword as jest.Mock).mockRejectedValue(
      new ApiError('Your current password doesn’t match.', 'WRONG_PASSWORD', 400),
    );
    const user = userEvent.setup();
    render(<ChangePasswordForm />);

    await user.type(screen.getByLabelText('Mật khẩu hiện tại'), 'WrongPass1!');
    await user.type(screen.getByLabelText('Mật khẩu mới'), 'NewPass1!');
    await user.type(screen.getByLabelText('Xác nhận mật khẩu mới'), 'NewPass1!');
    await user.click(screen.getByRole('button', { name: /Đổi mật khẩu/i }));

    expect(await screen.findByText(/Mật khẩu hiện tại chưa đúng/i)).toBeInTheDocument();
  });
});
