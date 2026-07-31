import { LoggerService, LogLevel } from '@nestjs/common';
import pino, { Logger as PinoInstance } from 'pino';

/**
 * Structured JSON logging in production, pretty-printed in development.
 * Replaces Nest's default console logger via `app.useLogger(...)` in main.ts.
 */
export class AppLogger implements LoggerService {
  private readonly pino: PinoInstance;

  constructor(nodeEnv: string) {
    this.pino = pino({
      level: nodeEnv === 'production' ? 'info' : 'debug',
      transport:
        nodeEnv === 'production'
          ? undefined
          : { target: 'pino-pretty', options: { colorize: true, singleLine: true } },
    });
  }

  log(message: unknown, context?: string) {
    this.pino.info({ context }, this.stringify(message));
  }

  error(message: unknown, trace?: string, context?: string) {
    this.pino.error({ context, trace }, this.stringify(message));
  }

  warn(message: unknown, context?: string) {
    this.pino.warn({ context }, this.stringify(message));
  }

  debug(message: unknown, context?: string) {
    this.pino.debug({ context }, this.stringify(message));
  }

  verbose(message: unknown, context?: string) {
    this.pino.trace({ context }, this.stringify(message));
  }

  setLogLevels?(_levels: LogLevel[]) {
    // Level is controlled via NODE_ENV above; no-op to satisfy the interface.
  }

  private stringify(message: unknown): string {
    return typeof message === 'string' ? message : JSON.stringify(message);
  }
}
