import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorBody {
  data: null;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
  meta: Record<string, never>;
  requestId: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Normalizes every thrown error (validation errors, NestJS HttpExceptions, and
 * unexpected exceptions) into one consistent error envelope, and ensures stack
 * traces / internal details never leak to the client outside development.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = request.requestId ?? 'unknown';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_SERVER_ERROR';
    let message = 'Something went wrong on our end. Please try again.';
    let details: Record<string, string[]> | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      code = HttpStatus[status] ?? 'ERROR';

      if (isRecord(body)) {
        const rawMessage = body.message;
        if (Array.isArray(rawMessage)) {
          message = 'Please check the highlighted fields.';
          details = { form: rawMessage.map(String) };
        } else if (typeof rawMessage === 'string') {
          message = rawMessage;
        }
        if (typeof body.code === 'string') {
          code = body.code;
        }
      } else if (typeof body === 'string') {
        message = body;
      }
    } else if (exception instanceof Error) {
      this.logger.error(exception.message, exception.stack, requestId);
    } else if (isRecord(exception) && typeof exception.message === 'string') {
      // Error-shaped object that fails `instanceof Error` (e.g. constructed in
      // a different module realm — seen from some native addons). Duck-type
      // it so we still get a real message/stack instead of a useless "{}".
      this.logger.error(
        `[non-instanceof-Error] ${exception.message}`,
        typeof exception.stack === 'string' ? exception.stack : undefined,
        requestId,
      );
    } else {
      let serialized: string;
      try {
        serialized = JSON.stringify(exception, Object.getOwnPropertyNames(isRecord(exception) ? exception : {}));
      } catch {
        serialized = String(exception);
      }
      this.logger.error(`Unknown (non-Error) exception thrown: ${serialized}`, undefined, requestId);
    }

    if (status >= 500) {
      this.logger.error(
        `[${requestId}] ${request.method} ${request.originalUrl} -> ${status}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    const body: ErrorBody = {
      data: null,
      error: { code, message, ...(details ? { details } : {}) },
      meta: {},
      requestId,
    };

    response.status(status).json(body);
  }
}
