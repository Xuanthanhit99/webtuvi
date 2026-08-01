import { z } from 'zod';

// Mirrors apps/api/src/auth/dto validation exactly (docs/reference Module 6 §6):
// minimum 8 characters plus at least one number or symbol.
const PASSWORD_HAS_NUMBER_OR_SYMBOL = /[0-9!@#$%^&*(),.?":{}|<>_\-+=[\]/\\;'~`]/;

export const passwordSchema = z
  .string()
  .min(8, 'Passwords need at least 8 characters')
  .max(128)
  .regex(PASSWORD_HAS_NUMBER_OR_SYMBOL, 'Passwords need at least one number or symbol');

export const registerSchema = z
  .object({
    displayName: z.string().min(1, 'Please tell us what to call you').max(80),
    email: z.string().email('That doesn’t look like a valid email'),
    password: passwordSchema,
    confirmPassword: z.string(),
    acceptedTerms: z.literal(true, {
      errorMap: () => ({ message: 'You need to accept the Terms and Privacy Notice to continue' }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'That password doesn’t match',
    path: ['confirmPassword'],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email('That doesn’t look like a valid email'),
  password: z.string().min(1, 'Please enter your password'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email('That doesn’t look like a valid email'),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const resendVerificationSchema = z.object({
  email: z.string().email('That doesn’t look like a valid email'),
});

export type ResendVerificationFormValues = z.infer<typeof resendVerificationSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Please enter your current password'),
    newPassword: passwordSchema,
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'That password doesn’t match',
    path: ['confirmNewPassword'],
  });

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'That password doesn’t match',
    path: ['confirmPassword'],
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
