'use client';

import { useState } from 'react';
import { safeNextPath, authReturnUrl } from '@/lib/safe-next-path';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { registerSchema, type RegisterFormValues } from '../schemas/auth-schemas';
import { authApi } from '../api/auth-api';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { FormField, fieldDescribedBy } from '@/components/ui/form-field';
import { Alert } from '@/components/ui/alert';
import { useAuth, useInvalidateAuth } from '@/providers/auth-provider';
import { ApiError } from '@/lib/api-error';
import { accountError } from '../account-error';
import { trackEvent } from '@/lib/analytics';

const PASSWORD_RULES = 'Từ 8 đến 128 ký tự, có ít nhất một chữ số hoặc ký hiệu.';

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invalidateAuth = useInvalidateAuth();
  const { refetch: refetchAuth } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(values: RegisterFormValues) {
    setFormError(null);
    trackEvent('signup_started', { feature: 'auth' });
    try {
      await authApi.register(values);
      await invalidateAuth();
      await refetchAuth();
      const next = safeNextPath(searchParams.get('next'));
      router.push(authReturnUrl('/onboarding', next));
    } catch (error) {
      if (error instanceof ApiError && error.code === 'EMAIL_ALREADY_EXISTS') {
        setError('email', { message: accountError(error) });
        return;
      }
      setFormError(accountError(error));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      {formError && (
        <Alert variant="error" title="Chưa thể tạo tài khoản">
          {formError}
        </Alert>
      )}

      <FormField label="Tên hiển thị" htmlFor="displayName" error={errors.displayName?.message}>
        <Input
          id="displayName"
          autoComplete="name"
          aria-describedby={fieldDescribedBy('displayName', !!errors.displayName, false)}
          invalid={!!errors.displayName}
          {...register('displayName')}
        />
      </FormField>

      <FormField label="Email" htmlFor="email" error={errors.email?.message}>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          aria-describedby={fieldDescribedBy('email', !!errors.email, false)}
          invalid={!!errors.email}
          {...register('email')}
        />
      </FormField>

      <FormField label="Mật khẩu" htmlFor="password" hint={PASSWORD_RULES} error={errors.password?.message}>
        <PasswordInput
          id="password"
          autoComplete="new-password"
          aria-describedby={fieldDescribedBy('password', !!errors.password, true)}
          invalid={!!errors.password}
          {...register('password')}
        />
      </FormField>

      <FormField label="Xác nhận mật khẩu" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
        <PasswordInput
          id="confirmPassword"
          autoComplete="new-password"
          aria-describedby={fieldDescribedBy('confirmPassword', !!errors.confirmPassword, false)}
          invalid={!!errors.confirmPassword}
          {...register('confirmPassword')}
        />
      </FormField>

      <Checkbox
        id="acceptedTerms"
        aria-invalid={!!errors.acceptedTerms}
        aria-describedby={errors.acceptedTerms ? 'acceptedTerms-error' : undefined}
        {...register('acceptedTerms')}
        label={
          <>
            Tôi đồng ý với{' '}
            <Link href="/terms" className="text-insight underline">
              Điều khoản
            </Link>{' '}
            và{' '}
            <Link href="/privacy" className="text-insight underline">
              Chính sách riêng tư
            </Link>
          </>
        }
      />
      {errors.acceptedTerms && (
        <p id="acceptedTerms-error" role="alert" className="-mt-3 text-body-sm text-caution">
          {errors.acceptedTerms.message}
        </p>
      )}

      <Button type="submit" fullWidth loading={isSubmitting}>
        Tạo tài khoản
      </Button>
    </form>
  );
}
