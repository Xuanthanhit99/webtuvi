'use client';

import { useState } from 'react';
import { safeNextPath, authReturnUrl } from '@/lib/safe-next-path';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { loginSchema, type LoginFormValues } from '../schemas/auth-schemas';
import { authApi } from '../api/auth-api';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Button } from '@/components/ui/button';
import { FormField, fieldDescribedBy } from '@/components/ui/form-field';
import { Alert } from '@/components/ui/alert';
import { useAuth, useInvalidateAuth } from '@/providers/auth-provider';
import { accountError } from '../account-error';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invalidateAuth = useInvalidateAuth();
  const { refetch: refetchAuth } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginFormValues) {
    setFormError(null);
    try {
      const user = await authApi.login(values);
      await invalidateAuth();
      await refetchAuth();
      const next = safeNextPath(searchParams.get('next'));
      router.push(user.onboardingCompletedAt ? next : authReturnUrl('/onboarding', next));
    } catch (error) {
      setFormError(accountError(error, 'login'));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      {formError && (
        <Alert variant="error" title="Chưa thể đăng nhập">
          {formError}
        </Alert>
      )}

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

      <FormField label="Mật khẩu" htmlFor="password" error={errors.password?.message}>
        <PasswordInput
          id="password"
          autoComplete="current-password"
          aria-describedby={fieldDescribedBy('password', !!errors.password, false)}
          invalid={!!errors.password}
          {...register('password')}
        />
      </FormField>

      <div className="-mt-2 text-right">
        <Link href="/forgot-password" className="text-body-sm text-text-secondary hover:text-text-primary">
          Quên mật khẩu?
        </Link>
      </div>

      <Button type="submit" fullWidth loading={isSubmitting}>
        Đăng nhập
      </Button>
    </form>
  );
}
