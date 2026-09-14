'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { clearAccountCache } from '@/lib/account-cache';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordSchema, type ResetPasswordFormValues } from '../schemas/auth-schemas';
import { authApi } from '../api/auth-api';
import { PasswordInput } from '@/components/ui/password-input';
import { Button } from '@/components/ui/button';
import { FormField, fieldDescribedBy } from '@/components/ui/form-field';
import { Alert } from '@/components/ui/alert';
import { toast } from '@/components/ui/toast';
import { accountError } from '../account-error';

const PASSWORD_RULES = 'Từ 8 đến 128 ký tự, có ít nhất một chữ số hoặc ký hiệu.';

export function ResetPasswordForm() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({ resolver: zodResolver(resetPasswordSchema) });

  async function onSubmit(values: ResetPasswordFormValues) {
    setFormError(null);
    if (!token) {
      setFormError('Liên kết không hợp lệ. Hãy yêu cầu liên kết mới.');
      return;
    }
    try {
      await authApi.resetPassword({ token, ...values });
      await clearAccountCache(queryClient);
      toast.success('Đã đặt lại mật khẩu. Vui lòng đăng nhập lại.');
      router.push('/login');
    } catch (error) {
      setFormError(accountError(error));
    }
  }

  if (!token) {
    return <Alert variant="error">Thiếu liên kết đặt lại mật khẩu. <Link href="/forgot-password" className="underline">Yêu cầu liên kết mới</Link>.</Alert>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      {formError && <Alert variant="error">{formError}</Alert>}
      {formError && <Link href="/forgot-password" className="text-body-sm text-insight underline">Yêu cầu liên kết mới</Link>}

      <FormField label="Mật khẩu mới" htmlFor="password" hint={PASSWORD_RULES} error={errors.password?.message}>
        <PasswordInput
          id="password"
          autoComplete="new-password"
          aria-describedby={fieldDescribedBy('password', !!errors.password, true)}
          invalid={!!errors.password}
          {...register('password')}
        />
      </FormField>

      <FormField label="Xác nhận mật khẩu mới" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
        <PasswordInput
          id="confirmPassword"
          autoComplete="new-password"
          aria-describedby={fieldDescribedBy('confirmPassword', !!errors.confirmPassword, false)}
          invalid={!!errors.confirmPassword}
          {...register('confirmPassword')}
        />
      </FormField>

      <Button type="submit" fullWidth loading={isSubmitting}>
        Đặt lại mật khẩu
      </Button>
    </form>
  );
}
