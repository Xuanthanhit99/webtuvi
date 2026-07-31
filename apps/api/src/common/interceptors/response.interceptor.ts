import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
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
 */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<ApiResponse<T>> {
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
