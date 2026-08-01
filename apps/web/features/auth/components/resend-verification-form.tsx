'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resendVerificationSchema, type ResendVerificationFormValues } from '../schemas/auth-schemas';
import { authApi } from '../api/auth-api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FormField, fieldDescribedBy } from '@/components/ui/form-field';
import { Alert } from '@/components/ui/alert';
import { ApiError } from '@/lib/api-error';

// Mirrors the server's default EMAIL_VERIFICATION_RESEND_COOLDOWN (60s). This is
// a client-side display countdown only — the server enforces the real cooldown
// regardless of what this timer shows.
const COOLDOWN_SECONDS = 60;

export function ResendVerificationForm() {
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResendVerificationFormValues>({ resolver: zodResolver(resendVerificationSchema) });

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  function startCooldown() {
    setCooldown(COOLDOWN_SECONDS);
    intervalRef.current = setInterval(() => {
      setCooldown((current) => {
        if (current <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
  }

  async function onSubmit(values: ResendVerificationFormValues) {
    setFormError(null);
    try {
      await authApi.resendVerification(values.email);
      setSent(true);
      startCooldown();
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'Something went wrong. Please try again.');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      {formError && <Alert variant="error">{formError}</Alert>}

      {sent && (
        <Alert variant="success" title="Check your email">
          If that address needs verifying, we’ve sent a new link.
        </Alert>
      )}

      <FormField
        label="Email"
        htmlFor="email"
        error={errors.email?.message}
        hint="We'll send a verification link if the account exists and isn't verified yet."
      >
        <Input
          id="email"
          type="email"
          autoComplete="email"
          aria-describedby={fieldDescribedBy('email', !!errors.email, true)}
          invalid={!!errors.email}
          {...register('email')}
        />
      </FormField>

      <Button type="submit" fullWidth loading={isSubmitting} disabled={cooldown > 0}>
        {cooldown > 0 ? `Resend available in ${cooldown}s` : 'Send verification link'}
      </Button>
    </form>
  );
}
