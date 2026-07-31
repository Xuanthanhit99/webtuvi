'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { useInvalidateAuth } from '@/providers/auth-provider';
import { ApiError } from '@/lib/api-error';

const PASSWORD_RULES = 'At least 8 characters, with a number or symbol.';

export function RegisterForm() {
  const router = useRouter();
  const invalidateAuth = useInvalidateAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(values: RegisterFormValues) {
    setFormError(null);
    try {
      await authApi.register(values);
      invalidateAuth();
      router.push('/onboarding');
    } catch (error) {
      if (error instanceof ApiError && error.code === 'EMAIL_ALREADY_EXISTS') {
        setError('email', { message: error.message });
        return;
      }
      setFormError(error instanceof ApiError ? error.message : 'Something went wrong. Please try again.');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      {formError && (
        <Alert variant="error" title="Couldn’t create your account">
          {formError}
        </Alert>
      )}

      <FormField label="Display name" htmlFor="displayName" error={errors.displayName?.message}>
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

      <FormField label="Password" htmlFor="password" hint={PASSWORD_RULES} error={errors.password?.message}>
        <PasswordInput
          id="password"
          autoComplete="new-password"
          aria-describedby={fieldDescribedBy('password', !!errors.password, true)}
          invalid={!!errors.password}
          {...register('password')}
        />
      </FormField>

      <FormField label="Confirm password" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
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
        {...register('acceptedTerms')}
        label={
          <>
            I agree to the{' '}
            <Link href="/terms" className="text-insight underline">
              Terms
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-insight underline">
              Privacy Notice
            </Link>
          </>
        }
      />
      {errors.acceptedTerms && (
        <p role="alert" className="-mt-3 text-body-sm text-caution">
          {errors.acceptedTerms.message}
        </p>
      )}

      <Button type="submit" fullWidth loading={isSubmitting}>
        Continue
      </Button>
    </form>
  );
}
