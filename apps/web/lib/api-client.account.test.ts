import { apiFetch } from './api-client';

function response(status: number, data: unknown) {
  return { status, ok: status >= 200 && status < 300, json: async () => data } as Response;
}
const originalFetch = global.fetch;
afterEach(() => { global.fetch = originalFetch; jest.restoreAllMocks(); });

it('restores an expired access session using cookies and retries once', async () => {
  global.fetch = jest.fn().mockResolvedValueOnce(response(401, {})).mockResolvedValueOnce(response(200, {})).mockResolvedValueOnce(response(200, { data: { id: 'user' } }));
  await expect(apiFetch('/auth/me')).resolves.toEqual({ id: 'user' });
  expect(global.fetch).toHaveBeenNthCalledWith(2, expect.stringContaining('/auth/refresh'), expect.objectContaining({ credentials: 'include', method: 'POST' }));
  expect(global.fetch).toHaveBeenCalledTimes(3);
});

it('announces confirmed expiration after refresh rejection', async () => {
  const expired = jest.fn();
  window.addEventListener('menhvi:session-expired', expired);
  global.fetch = jest.fn().mockResolvedValue(response(401, { error: { code: 'SESSION_EXPIRED', message: 'expired' } }));
  await expect(apiFetch('/auth/me')).rejects.toMatchObject({ status: 401 });
  expect(expired).toHaveBeenCalledTimes(1);
  window.removeEventListener('menhvi:session-expired', expired);
});

it('does not treat a refresh network failure as proof of logout', async () => {
  const expired = jest.fn();
  window.addEventListener('menhvi:session-expired', expired);
  global.fetch = jest.fn().mockResolvedValueOnce(response(401, {})).mockRejectedValueOnce(new TypeError('network'));
  await expect(apiFetch('/auth/me')).rejects.toMatchObject({ status: 503, code: 'SESSION_RESTORE_UNAVAILABLE' });
  expect(expired).not.toHaveBeenCalled();
  window.removeEventListener('menhvi:session-expired', expired);
});
