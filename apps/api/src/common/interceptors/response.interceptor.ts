import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
// Not re-exported from '@nestjs/common's public barrel, only from this internal
// (but same-package, stable) path — see Sse()'s own decorator implementation.
import { SSE_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request } from 'express';

export interface ApiResponse<T> {
  data: T;
  meta: Record<string, unknown>;
  requestId: string;
}

/**
 * Wraps every successful controller response in the project-wide envelope
 * `{ data, meta, requestId }` so the frontend never has to special-case shapes
 * per endpoint. Errors are wrapped separately by HttpExceptionFilter.
 *
 * Explicitly skips `@Sse()` routes (Companion Core's streaming endpoint):
 * wrapping each emitted `MessageEvent` in this envelope would nest the SSE
 * frame's `type`/`data` fields one level too deep, so Nest's SSE serializer
 * never sees a top-level `type` to write an `event:` line for — the browser's
 * EventSource then never fires the named `token`/`done`/`stream_error`
 * listeners at all. This was caught by an actual browser-driven Playwright
 * run; a Node-side supertest check had missed it because it only asserted a
 * substring match on the (still technically present, just wrongly nested) JSON.
 */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T> | T> {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<ApiResponse<T> | T> {
    const isSse = this.reflector.get<boolean>(SSE_METADATA, context.getHandler());
    if (isSse) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();

    return next.handle().pipe(
      map((data) => ({
        data,
        meta: {},
        requestId: request.requestId,
      })),
    );
  }
}
