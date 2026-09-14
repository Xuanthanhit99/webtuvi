import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithQuery } from '@/test/render-with-query';
import { AccountDataSection } from './account-data-section';
import { settingsApi } from '../api/settings-api';
import { useInvalidateAuth } from '@/providers/auth-provider';
import { ApiError } from '@/lib/api-error';
import { Toaster } from '@/components/ui/toast';

function renderSection() {
  return renderWithQuery(
    <>
      <AccountDataSection />
      <Toaster />
    </>,
  );
}

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/providers/auth-provider', () => ({
  useInvalidateAuth: jest.fn(() => jest.fn()),
}));

jest.mock('../api/settings-api', () => ({
  settingsApi: { export: { create: jest.fn(), get: jest.fn() }, deleteAccount: jest.fn() },
}));

describe('AccountDataSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = jest.fn();
  });

  it('exports and downloads a JSON file on "Export"', async () => {
    (settingsApi.export.create as jest.Mock).mockResolvedValue({
      jobId: 'job-1',
      status: 'completed',
      result: { exportVersion: 1, account: { id: 'user-1', email: 'a@example.com' } },
    });
    const user = userEvent.setup();
    renderSection();

    await user.click(screen.getByRole('button', { name: 'Xuất dữ liệu tài khoản' }));

    await waitFor(() => expect(settingsApi.export.create).toHaveBeenCalled());
    expect(global.URL.createObjectURL).toHaveBeenCalled();
    expect(await screen.findByText(/Đã tải xuống bản xuất dữ liệu/i)).toBeInTheDocument();
  });

  it('shows an error toast when export fails', async () => {
    (settingsApi.export.create as jest.Mock).mockRejectedValue(new Error('boom'));
    const user = userEvent.setup();
    renderSection();

    await user.click(screen.getByRole('button', { name: 'Xuất dữ liệu tài khoản' }));

    expect(await screen.findByText(/Chưa thể xuất dữ liệu/i)).toBeInTheDocument();
  });

  it('opens a destructive confirmation dialog requiring the current password before deleting', async () => {
    const user = userEvent.setup();
    renderSection();

    await user.click(screen.getByRole('button', { name: 'Xóa tài khoản' }));

    expect(await screen.findByRole('heading', { name: /Xóa tài khoản của bạn/i })).toBeInTheDocument();
    // The confirm button stays disabled until a password is entered — never a bare confirm click.
    expect(screen.getByRole('button', { name: /Xóa tài khoản vĩnh viễn/i })).toBeDisabled();
  });

  it('cancels without calling the API', async () => {
    const user = userEvent.setup();
    renderSection();

    await user.click(screen.getByRole('button', { name: 'Xóa tài khoản' }));
    await screen.findByRole('heading', { name: /Xóa tài khoản của bạn/i });
    await user.click(screen.getByRole('button', { name: 'Hủy' }));

    expect(settingsApi.deleteAccount).not.toHaveBeenCalled();
  });

  it('deletes the account, invalidates auth, and redirects to /login on success', async () => {
    const invalidate = jest.fn();
    (useInvalidateAuth as jest.Mock).mockReturnValue(invalidate);
    (settingsApi.deleteAccount as jest.Mock).mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderSection();

    await user.click(screen.getByRole('button', { name: 'Xóa tài khoản' }));
    await screen.findByRole('heading', { name: /Xóa tài khoản của bạn/i });
    await user.type(screen.getByLabelText(/Xác nhận mật khẩu của bạn/i), 'CorrectPassword1!');
    await user.click(screen.getByRole('button', { name: /Xóa tài khoản vĩnh viễn/i }));

    await waitFor(() => expect(settingsApi.deleteAccount).toHaveBeenCalledWith('CorrectPassword1!'));
    await waitFor(() => expect(invalidate).toHaveBeenCalled());
    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('shows a real error and never redirects when the password is wrong', async () => {
    (settingsApi.deleteAccount as jest.Mock).mockRejectedValue(new ApiError('Your password doesn’t match.', 'WRONG_PASSWORD', 400));
    const user = userEvent.setup();
    renderSection();

    await user.click(screen.getByRole('button', { name: 'Xóa tài khoản' }));
    await screen.findByRole('heading', { name: /Xóa tài khoản của bạn/i });
    await user.type(screen.getByLabelText(/Xác nhận mật khẩu của bạn/i), 'WrongPassword');
    await user.click(screen.getByRole('button', { name: /Xóa tài khoản vĩnh viễn/i }));

    expect(await screen.findByText(/Mật khẩu hiện tại chưa đúng/i)).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });
});
