import { ApiError } from '@/lib/api-error';
import { accountError } from './account-error';

it('uses the same login error for missing accounts and wrong passwords', () => {
  const missing = accountError(new ApiError('internal user lookup detail', 'ACCOUNT_NOT_FOUND', 401), 'login');
  const wrong = accountError(new ApiError('internal hash detail', 'WRONG_PASSWORD', 401), 'login');
  expect(missing).toBe(wrong);
  expect(wrong).toBe('Email hoặc mật khẩu chưa đúng.');
});
it('maps rate limits and network failures without exposing arbitrary server details', () => {
  expect(accountError(new ApiError('private detail', 'LIMIT', 429))).toContain('quá nhiều lần');
  expect(accountError(new TypeError('network'))).toContain('kiểm tra mạng');
  expect(accountError(new ApiError('private detail', 'INTERNAL', 500))).not.toContain('private detail');
});
