import { ApiError } from '@/lib/api-error';

/** Account forms never display arbitrary server/internal error messages. */
export function accountError(error: unknown, context: 'login' | 'password' | 'account' = 'account'): string {
  if (!(error instanceof ApiError)) return 'Chưa thể kết nối. Hãy kiểm tra mạng và thử lại.';
  if (error.status === 429) return 'Bạn đã thử quá nhiều lần. Vui lòng đợi một lát trước khi thử lại.';
  if (error.code === 'WRONG_PASSWORD') return context === 'password' ? 'Mật khẩu hiện tại chưa đúng.' : 'Email hoặc mật khẩu chưa đúng.';
  if (error.code === 'ACCOUNT_NOT_FOUND') return 'Email hoặc mật khẩu chưa đúng.';
  if (error.code === 'EMAIL_ALREADY_EXISTS') return 'Email này đã được sử dụng. Bạn có thể đăng nhập hoặc lấy lại mật khẩu.';
  if (error.code === 'RESET_TOKEN_EXPIRED') return 'Liên kết không còn hiệu lực hoặc đã được sử dụng. Hãy yêu cầu liên kết mới.';
  if (error.code === 'SESSION_EXPIRED' || error.status === 401) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
  if (error.status === 400) return 'Thông tin chưa hợp lệ. Vui lòng kiểm tra các trường và thử lại.';
  return 'Chưa thể hoàn tất yêu cầu. Vui lòng thử lại sau.';
}
