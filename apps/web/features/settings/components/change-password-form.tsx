'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { changePasswordSchema, type ChangePasswordFormValues } from '@/features/auth/schemas/auth-schemas';
import { authApi } from '@/features/auth/api/auth-api';
import { PasswordInput } from '@/components/ui/password-input';
import { Button } from '@/components/ui/button';
import { FormField, fieldDescribedBy } from '@/components/ui/form-field';
import { Alert } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { toast } from '@/components/ui/toast';
import { accountError } from '@/features/auth/account-error';

const PASSWORD_RULES = 'Từ 8 đến 128 ký tự, có ít nhất một chữ số hoặc ký hiệu.';

export function ChangePasswordForm() {
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormValues>({ resolver: zodResolver(changePasswordSchema) });

  async function onSubmit(values: ChangePasswordFormValues) {
    setFormError(null);
    try {
      await authApi.changePassword(values);
      await queryClient.invalidateQueries({ queryKey: ['sessions'] });
      reset();
      toast.success('Đã đổi mật khẩu và đăng xuất các thiết bị khác.');
    } catch (error) {
      setFormError(accountError(error, 'password'));
    }
  }

  return (
    <Card>
      <p className="mb-1 text-body-sm font-semibold text-text-secondary">Đổi mật khẩu</p>
      <p className="mb-4 text-body-sm text-text-secondary">
        Đổi mật khẩu sẽ đăng xuất các thiết bị khác. Thiết bị này vẫn đăng nhập.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        {formError && <Alert variant="error">{formError}</Alert>}

        <FormField label="Mật khẩu hiện tại" htmlFor="currentPassword" error={errors.currentPassword?.message}>
          <PasswordInput
            id="currentPassword"
            autoComplete="current-password"
            aria-describedby={fieldDescribedBy('currentPassword', !!errors.currentPassword, false)}
            invalid={!!errors.currentPassword}
            {...register('currentPassword')}
          />
        </FormField>

        <FormField
          label="Mật khẩu mới"
          htmlFor="newPassword"
          hint={PASSWORD_RULES}
          error={errors.newPassword?.message}
        >
          <PasswordInput
            id="newPassword"
            autoComplete="new-password"
            aria-describedby={fieldDescribedBy('newPassword', !!errors.newPassword, true)}
            invalid={!!errors.newPassword}
            {...register('newPassword')}
          />
        </FormField>

        <FormField
          label="Xác nhận mật khẩu mới"
          htmlFor="confirmNewPassword"
          error={errors.confirmNewPassword?.message}
        >
          <PasswordInput
            id="confirmNewPassword"
            autoComplete="new-password"
            aria-describedby={fieldDescribedBy('confirmNewPassword', !!errors.confirmNewPassword, false)}
            invalid={!!errors.confirmNewPassword}
            {...register('confirmNewPassword')}
          />
        </FormField>

        <Button type="submit" loading={isSubmitting} className="self-start">
          Đổi mật khẩu
        </Button>
      </form>
    </Card>
  );
}
