import { ApiError } from '@/lib/api-client';

/**
 * Vietnamese, Mệnh Vi-consistent copy for auth errors — never the raw backend message (the DTO
 * validation strings in apps/api/src/auth/dto/*.dto.ts are English and not meant for end users).
 * Codes are the exact ones AuthService/EmailVerificationService throw — see the Phase 02 backend
 * audit in the plan file for the full list.
 */
const MESSAGES: Record<string, string> = {
  ACCOUNT_NOT_FOUND: 'Không tìm thấy tài khoản với email này.',
  WRONG_PASSWORD: 'Mật khẩu không đúng.',
  EMAIL_ALREADY_EXISTS: 'Email này đã có tài khoản — bạn muốn đăng nhập không?',
  SESSION_EXPIRED: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  VERIFICATION_TOKEN_INVALID: 'Liên kết xác thực không hợp lệ.',
  VERIFICATION_TOKEN_EXPIRED: 'Liên kết xác thực đã hết hạn.',
  RESET_TOKEN_EXPIRED: 'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.',
};

export function getAuthErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 429) return 'Bạn đã thử quá nhiều lần. Vui lòng đợi ít phút rồi thử lại.';
    if (error.status === 400) return 'Thông tin chưa hợp lệ. Vui lòng kiểm tra lại.';
    return MESSAGES[error.code] ?? 'Có lỗi xảy ra. Vui lòng thử lại.';
  }
  return 'Không có kết nối mạng. Vui lòng kiểm tra và thử lại.';
}
