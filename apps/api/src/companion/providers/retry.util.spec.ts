import { withRetry } from './retry.util';
import { AIProviderError } from './provider.types';

describe('withRetry', () => {
  it('returns the result on first success without retrying', async () => {
    const fn = jest.fn().mockResolvedValue('ok');
    const result = await withRetry(fn, { maxRetries: 3, baseDelayMs: 1 });
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries a retryable error up to maxRetries, then succeeds', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new AIProviderError('rate limited', true, 429))
      .mockRejectedValueOnce(new AIProviderError('server error', true, 500))
      .mockResolvedValueOnce('ok');

    const result = await withRetry(fn, { maxRetries: 3, baseDelayMs: 1 });
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('throws immediately on a non-retryable error, without retrying', async () => {
    const fn = jest.fn().mockRejectedValue(new AIProviderError('bad request', false, 400));
    await expect(withRetry(fn, { maxRetries: 3, baseDelayMs: 1 })).rejects.toThrow('bad request');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('throws after exhausting maxRetries on a persistently retryable error', async () => {
    const fn = jest.fn().mockRejectedValue(new AIProviderError('still down', true, 503));
    await expect(withRetry(fn, { maxRetries: 2, baseDelayMs: 1 })).rejects.toThrow('still down');
    expect(fn).toHaveBeenCalledTimes(3); // initial attempt + 2 retries
  });

  it('does not retry a plain (non-AIProviderError) error', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('unexpected'));
    await expect(withRetry(fn, { maxRetries: 3, baseDelayMs: 1 })).rejects.toThrow('unexpected');
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
