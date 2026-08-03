import { HttpException, HttpStatus } from '@nestjs/common';
import { CompanionThrottlerGuard } from './companion-throttler.guard';

describe('CompanionThrottlerGuard (Sprint 2B audit Finding 2A)', () => {
  it('throws a normalized RATE_LIMITED HttpException (429) instead of the library’s plain-string ThrottlerException', async () => {
    const guard = Object.create(CompanionThrottlerGuard.prototype) as CompanionThrottlerGuard;
    const throwThrottlingException = (
      guard as unknown as { throwThrottlingException: () => Promise<void> }
    ).throwThrottlingException.bind(guard);

    await expect(throwThrottlingException()).rejects.toThrow(HttpException);

    try {
      await throwThrottlingException();
      throw new Error('expected throwThrottlingException to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      const httpError = error as HttpException;
      expect(httpError.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
      expect(httpError.getResponse()).toMatchObject({ code: 'RATE_LIMITED' });
    }
  });
});
