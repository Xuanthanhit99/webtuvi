import { z } from 'zod';

// Mirrors apps/api/src/auth/dto validation exactly (docs/reference Module 6 §6):
// minimum 8 characters plus at least one number or symbol.
const PASSWORD_HAS_NUMBER_OR_SYMBOL = /[0-9!@#$%^&*(),.?":{}|<>_\-+=[\]/\\;'~`]/;

export const passwordSchema = z
  .string()
  .min(8, 'Mật khẩu cần ít nhất 8 ký tự')
  .max(128, 'Mật khẩu không được quá 128 ký tự')
  .regex(PASSWORD_HAS_NUMBER_OR_SYMBOL, 'Mật khẩu cần ít nhất một chữ số hoặc ký hiệu');

export const registerSchema = z
  .object({
    displayName: z.string().min(1, 'Vui lòng nhập tên hiển thị').max(80, 'Tên hiển thị không được quá 80 ký tự'),
    email: z.string().email('Vui lòng nhập email hợp lệ'),
    password: passwordSchema,
    confirmPassword: z.string(),
    acceptedTerms: z.literal(true, {
      errorMap: () => ({ message: 'Bạn cần đồng ý với Điều khoản và Chính sách riêng tư để tiếp tục' }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận chưa khớp',
    path: ['confirmPassword'],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email('Vui lòng nhập email hợp lệ'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email('Vui lòng nhập email hợp lệ'),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const resendVerificationSchema = z.object({
  email: z.string().email('Vui lòng nhập email hợp lệ'),
});

export type ResendVerificationFormValues = z.infer<typeof resendVerificationSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
    newPassword: passwordSchema,
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Mật khẩu xác nhận chưa khớp',
    path: ['confirmNewPassword'],
  });

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận chưa khớp',
    path: ['confirmPassword'],
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
