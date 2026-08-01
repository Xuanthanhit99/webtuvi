'use client';

import { useState } from 'react';
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
import { ApiError } from '@/lib/api-error';

const PASSWORD_RULES = 'At least 8 characters, with a number or symbol.';

export function ChangePasswordForm() {
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
      reset();
      toast.success('Your password has been changed. Other devices have been signed out.');
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'Something went wrong. Please try again.');
    }
  }

  return (
    <Card>
      <p className="mb-1 text-body-sm font-semibold text-text-secondary">Change password</p>
      <p className="mb-4 text-body-sm text-text-secondary">
        Changing your password signs out every other device — this one stays signed in.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        {formError && <Alert variant="error">{formError}</Alert>}

        <FormField label="Current password" htmlFor="currentPassword" error={errors.currentPassword?.message}>
          <PasswordInput
            id="currentPassword"
            autoComplete="current-password"
            aria-describedby={fieldDescribedBy('currentPassword', !!errors.currentPassword, false)}
            invalid={!!errors.currentPassword}
            {...register('currentPassword')}
          />
        </FormField>

        <FormField
          label="New password"
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
          label="Confirm new password"
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
          Change password
        </Button>
      </form>
    </Card>
  );
}
