'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { ShieldAlert } from 'lucide-react';
import { settingsApi } from '../api/settings-api';
import { useInvalidateAuth } from '@/providers/auth-provider';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { PasswordInput } from '@/components/ui/password-input';
import { FormField } from '@/components/ui/form-field';
import { Alert } from '@/components/ui/alert';
import { toast } from '@/components/ui/toast';
import { accountError } from '@/features/auth/account-error';

/**
 * Sprint 10 — the real "Xuất dữ liệu tài khoản" / "Xóa tài khoản của tôi" controls the Settings page's
 * "More settings" card previously described as "coming soon." See
 * docs/architecture/account-data-rights.md for what's exported/deleted/retained and why.
 */
export function AccountDataSection() {
  const router = useRouter();
  const invalidateAuth = useInvalidateAuth();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const createExport = useMutation({
    mutationFn: () => settingsApi.export.create(),
    onSuccess: (job) => {
      const blob = new Blob([JSON.stringify(job.result, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `menhvi-account-export-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Đã tải xuống bản xuất dữ liệu.');
    },
    onError: () => toast.error("Chưa thể xuất dữ liệu. Vui lòng thử lại sau."),
  });

  const deleteAccount = useMutation({
    mutationFn: () => settingsApi.deleteAccount(password),
    onSuccess: async () => {
      await invalidateAuth(true);
      toast.success('Tài khoản đã được xóa.');
      router.push('/login');
    },
    onError: (error: unknown) => {
      setDeleteError(accountError(error, 'password'));
    },
  });

  function closeDialog() {
    setConfirmOpen(false);
    setPassword('');
    setDeleteError(null);
  }

  return (
    <Card className="flex flex-col gap-4">
      <div>
        <p className="mb-1 text-body-sm font-semibold text-text-secondary">Dữ liệu của bạn</p>
        <p className="text-body-sm text-text-secondary">
          Tải xuống dữ liệu tài khoản hoặc yêu cầu xóa tài khoản vĩnh viễn.
        </p>
      </div>

      <div className="flex flex-col gap-3 border-t border-border-subtle pt-4">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <p className="text-body-sm font-medium text-text-primary">Xuất dữ liệu tài khoản</p>
            <p className="text-body-sm text-text-secondary">
              Một tệp gồm thông tin tài khoản, cuộc trò chuyện, ký ức, nhật ký, kết quả khám phá và lịch sử Premium.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => createExport.mutate()} loading={createExport.isPending}>
            Xuất dữ liệu tài khoản
          </Button>
        </div>

        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center border-t border-border-subtle pt-3">
          <div>
            <p className="text-body-sm font-medium text-text-primary">Xóa tài khoản của tôi</p>
            <p className="text-body-sm text-text-secondary">Không thể hoàn tác. Quyền truy cập Premium kết thúc ngay khi xóa.</p>
          </div>
          <Button variant="danger" size="sm" onClick={() => setConfirmOpen(true)}>
            Xóa tài khoản
          </Button>
        </div>
      </div>

      <Dialog
        closeLabel="Đóng hộp thoại"
        open={confirmOpen}
        onClose={closeDialog}
        title="Xóa tài khoản của bạn?"
        description="Cuộc trò chuyện, ký ức, nhật ký và kết quả khám phá sẽ bị xóa vĩnh viễn. Mọi phiên đăng nhập bị thu hồi và quyền truy cập Premium kết thúc ngay lập tức."
        variant="destructive"
      >
        <div className="flex items-start gap-2 rounded-md border border-caution/30 bg-caution/5 p-3 text-body-sm text-caution">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            Không thể hoàn tác. Lịch sử thanh toán được giữ lại cho mục đích kế toán, không còn gắn với thông tin hồ sơ cá nhân sau khi tài khoản bị xóa.
          </span>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setDeleteError(null);
            deleteAccount.mutate();
          }}
          noValidate
          className="mt-4 flex flex-col gap-4"
        >
          {deleteError && <Alert variant="error">{deleteError}</Alert>}

          <FormField label="Xác nhận mật khẩu của bạn" htmlFor="delete-account-password">
            <PasswordInput
              id="delete-account-password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </FormField>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={closeDialog}>
              Hủy
            </Button>
            <Button type="submit" variant="danger" loading={deleteAccount.isPending} disabled={password.length === 0}>
              Xóa tài khoản vĩnh viễn
            </Button>
          </div>
        </form>
      </Dialog>
    </Card>
  );
}
