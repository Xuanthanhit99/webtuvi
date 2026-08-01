import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { CsrfService } from './csrf.service';
import { CSRF_HEADER, CSRF_TOKEN_COOKIE, SKIP_CSRF_KEY } from './csrf.constants';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Global guard: double-submit cookie CSRF check on every state-changing
 * request, unless the route is decorated with @SkipCsrf(). See
 * docs/security/sprint-2a-security.md for which routes skip it and why.
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly csrfService: CsrfService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    if (SAFE_METHODS.has(request.method.toUpperCase())) return true;

    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_CSRF_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skip) return true;

    const cookieToken = request.cookies?.[CSRF_TOKEN_COOKIE] as string | undefined;
    const headerTokenRaw = request.headers[CSRF_HEADER];
    const headerToken = Array.isArray(headerTokenRaw) ? headerTokenRaw[0] : headerTokenRaw;

    if (!cookieToken || !headerToken) {
      throw new ForbiddenException({
        code: 'CSRF_TOKEN_MISSING',
        message: 'This request is missing a required security token. Please refresh the page and try again.',
      });
    }

    if (cookieToken !== headerToken || !this.csrfService.verifyToken(cookieToken)) {
      throw new ForbiddenException({
        code: 'CSRF_TOKEN_INVALID',
        message: 'This request could not be verified. Please refresh the page and try again.',
      });
    }

    return true;
  }
}
