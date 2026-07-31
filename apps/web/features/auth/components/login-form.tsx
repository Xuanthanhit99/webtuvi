'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { useInvalidateAuth } from '@/providers/auth-provider';
import { ApiError } from '@/lib/api-error';

export function LoginForm() {
  const router = useRouter();
  const invalidateAuth = useInvalidateAuth();
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
      invalidateAuth();
      router.push(user.onboardingCompletedAt ? '/dashboard' : '/onboarding');
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'Something went wrong. Please try again.');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      {formError && (
        <Alert variant="error" title="Couldn’t log you in">
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

      <FormField label="Password" htmlFor="password" error={errors.password?.message}>
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
          Forgot password?
        </Link>
      </div>

      <Button type="submit" fullWidth loading={isSubmitting}>
        Log in
      </Button>
    </form>
  );
}
