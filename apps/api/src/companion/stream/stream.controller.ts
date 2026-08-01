import { Controller, MessageEvent, Param, Sse, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { StreamService } from './stream.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

/**
 * SSE, not WebSocket — the frontend connects with a plain `EventSource`.
 * `GET` is a safe method, so this is never subject to the CSRF guard (see
 * CsrfGuard's SAFE_METHODS check) — appropriate here since EventSource can't
 * send a custom header anyway. Cancel is just the browser closing the
 * EventSource; the resulting RxJS teardown below aborts the in-flight
 * provider call.
 *
 * Emits `stream_error` for a genuine application-level failure — deliberately
 * NOT the SSE event name "error": `EventSource` dispatches its own native
 * connection-level `error` event on transport failures, and a server-sent
 * custom event also literally named `error` would be indistinguishable from
 * that on the client. Using a distinct name lets the frontend tell "the
 * server told us generation failed" (retryable, show a Retry action) apart
 * from "the connection itself dropped" (offline/reconnect handling).
 */
@ApiTags('companion')
@Controller('companion/conversations')
@UseGuards(JwtAuthGuard)
export class StreamController {
  constructor(private readonly streamService: StreamService) {}

  @Sse(':id/messages/stream')
  @ApiOperation({ summary: 'Stream the assistant reply to the most recent pending user message (SSE)' })
  stream(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Observable<MessageEvent> {
    return new Observable<MessageEvent>((subscriber) => {
      const controller = new AbortController();

      (async () => {
        try {
          for await (const event of this.streamService.generate(user.id, id, controller.signal)) {
            const type = event.type === 'error' ? 'stream_error' : event.type;
            subscriber.next({ type, data: event.data });
          }
          subscriber.complete();
        } catch (error) {
          subscriber.error(error);
        }
      })();

      return () => controller.abort();
    });
  }
}
