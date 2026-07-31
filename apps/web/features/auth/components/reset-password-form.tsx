'use client';

import { useState } from 'react';
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
import { ApiError } from '@/lib/api-error';

const PASSWORD_RULES = 'At least 8 characters, with a number or symbol.';

export function ResetPasswordForm() {
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
      setFormError('This link has expired.');
      return;
    }
    try {
      await authApi.resetPassword({ token, ...values });
      toast.success('Your password has been reset. Please log in.');
      router.push('/login');
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'Something went wrong. Please try again.');
    }
  }

  if (!token) {
    return <Alert variant="error">This link has expired. Request a new one from the forgot-password page.</Alert>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      {formError && <Alert variant="error">{formError}</Alert>}

      <FormField label="New password" htmlFor="password" hint={PASSWORD_RULES} error={errors.password?.message}>
        <PasswordInput
          id="password"
          autoComplete="new-password"
          aria-describedby={fieldDescribedBy('password', !!errors.password, true)}
          invalid={!!errors.password}
          {...register('password')}
        />
      </FormField>

      <FormField label="Confirm new password" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
        <PasswordInput
          id="confirmPassword"
          autoComplete="new-password"
          aria-describedby={fieldDescribedBy('confirmPassword', !!errors.confirmPassword, false)}
          invalid={!!errors.confirmPassword}
          {...register('confirmPassword')}
        />
      </FormField>

      <Button type="submit" fullWidth loading={isSubmitting}>
        Reset password
      </Button>
    </form>
  );
}
