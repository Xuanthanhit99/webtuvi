import { Injectable } from '@nestjs/common';
import { ThrottlerException, ThrottlerGuard } from '@nestjs/throttler';

/**
 * Overrides the default "ThrottlerException: Too Many Requests" message (which
 * leaks implementation detail) with the plain, calm copy docs/reference Module 6
 * §11 specifies for this exact error.
 */
@Injectable()
export class AuthThrottlerGuard extends ThrottlerGuard {
  protected override async throwThrottlingException(): Promise<void> {
    throw new ThrottlerException('Too many attempts — please try again in a few minutes.');
  }
}
