'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '../schemas/auth-schemas';
import { authApi } from '../api/auth-api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FormField, fieldDescribedBy } from '@/components/ui/form-field';
import { Alert } from '@/components/ui/alert';
import { accountError } from '../account-error';

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({ resolver: zodResolver(forgotPasswordSchema) });

  async function onSubmit(values: ForgotPasswordFormValues) {
    setFormError(null);
    try {
      await authApi.forgotPassword(values.email);
      setSent(true);
    } catch (error) {
      setFormError(accountError(error));
    }
  }

  if (sent) {
    return (
      <Alert variant="success" title="Kiểm tra hộp thư">
        Nếu có tài khoản dùng email này, Mệnh Vi sẽ gửi liên kết đặt lại mật khẩu. Hãy kiểm tra cả thư rác và thời hạn ghi trong email.
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      {formError && <Alert variant="error">{formError}</Alert>}

      <FormField
        label="Email"
        htmlFor="email"
        error={errors.email?.message}
        hint="Nếu có tài khoản dùng email này, bạn sẽ nhận được liên kết đặt lại mật khẩu."
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

      <Button type="submit" fullWidth loading={isSubmitting}>
        Gửi liên kết đặt lại
      </Button>
    </form>
  );
}
