import 'reflect-metadata';
import { Reflector } from '@nestjs/core';
import { AuthController } from '../../auth/auth.controller';
import { ConversationController } from '../../companion/conversation/conversation.controller';
import { PaymentController } from '../../payment/payment.controller';
import { NatalChartController } from '../../natal-chart/natal-chart.controller';
import { NumerologyController } from '../../numerology/numerology.controller';
import { TarotController } from '../../tarot/tarot.controller';
import { NotificationsController } from '../../notifications/notifications.controller';
import { JournalExportController } from '../../journal/export/journal-export.controller';
import { MemoryExportController } from '../../memory/export/memory-export.controller';
import { AccountExportController } from '../../users/export/account-export.controller';

const THROTTLER_SKIP = 'THROTTLER:SKIP';

// Every named throttler registered in ThrottlerModule (app.module.ts), excluding `default`, which
// intentionally applies everywhere and is never meant to be skipped by a feature route.
const ALL_NAMED_THROTTLERS = ['auth', 'companion', 'companion-ip', 'payment', 'discovery', 'discovery-ip', 'admin'] as const;

interface ThrottledRoute {
  description: string;
  controller: { new (...args: never[]): unknown };
  handlerName: string;
  /** The bucket(s) this route intentionally participates in — every other named throttler must be skipped. */
  ownBuckets: string[];
}

/**
 * Sprint 13 — regression coverage for the "named throttler bleed-through" bug class first fixed by
 * `f8fcba1` (auth vs companion) and rediscovered twice more in this sprint (auth vs payment,
 * companion vs payment, and three export routes vs payment). Every named throttler in
 * ThrottlerModule is checked against every guarded route by default — a route that doesn't
 * explicitly `@SkipThrottle()` every bucket it doesn't own is silently subject to that bucket's
 * unrelated limit too. This test enumerates every route known to opt into a named throttler and
 * asserts its skip list is complete, so a future new bucket (or a route that forgets to update its
 * skip list when one is added) fails CI instead of shipping a silent cross-feature rate-limit leak.
 */
const ROUTES: ThrottledRoute[] = [
  { description: 'auth.register', controller: AuthController, handlerName: 'register', ownBuckets: ['auth'] },
  { description: 'auth.login', controller: AuthController, handlerName: 'login', ownBuckets: ['auth'] },
  {
    description: 'auth.forgotPassword',
    controller: AuthController,
    handlerName: 'forgotPassword',
    ownBuckets: ['auth'],
  },
  { description: 'auth.resetPassword', controller: AuthController, handlerName: 'resetPassword', ownBuckets: ['auth'] },
  { description: 'auth.verifyEmail', controller: AuthController, handlerName: 'verifyEmail', ownBuckets: ['auth'] },
  {
    description: 'auth.resendVerification',
    controller: AuthController,
    handlerName: 'resendVerification',
    ownBuckets: ['auth'],
  },
  {
    description: 'auth.changePassword',
    controller: AuthController,
    handlerName: 'changePassword',
    ownBuckets: ['auth'],
  },
  {
    description: 'companion.sendMessage',
    controller: ConversationController,
    handlerName: 'sendMessage',
    ownBuckets: ['companion', 'companion-ip'],
  },
  {
    description: 'payment.createCheckout',
    controller: PaymentController,
    handlerName: 'createCheckout',
    ownBuckets: ['payment'],
  },
  {
    description: 'natal-chart.retryInterpretation',
    controller: NatalChartController,
    handlerName: 'retryInterpretation',
    ownBuckets: ['discovery', 'discovery-ip'],
  },
  {
    description: 'numerology.retryInterpretation',
    controller: NumerologyController,
    handlerName: 'retryInterpretation',
    ownBuckets: ['discovery', 'discovery-ip'],
  },
  {
    description: 'tarot.retryInterpretation',
    controller: TarotController,
    handlerName: 'retryInterpretation',
    ownBuckets: ['discovery', 'discovery-ip'],
  },
  {
    // Class-level @SkipThrottle — getAllAndOverride still resolves it via the class ref.
    description: 'notifications (class-level)',
    controller: NotificationsController,
    handlerName: 'list',
    ownBuckets: [],
  },
  {
    description: 'journal-export.create',
    controller: JournalExportController,
    handlerName: 'create',
    ownBuckets: [],
  },
  {
    description: 'memory-export.create',
    controller: MemoryExportController,
    handlerName: 'create',
    ownBuckets: [],
  },
  {
    description: 'account-export.create',
    controller: AccountExportController,
    handlerName: 'create',
    ownBuckets: [],
  },
];

describe('named throttler bucket isolation (Sprint 13 — auth/payment/companion bleed-through)', () => {
  const reflector = new Reflector();

  it.each(ROUTES)('$description skips every named throttler it does not own', ({ controller, handlerName, ownBuckets }) => {
    const handler = (controller.prototype as Record<string, unknown>)[handlerName];
    expect(typeof handler).toBe('function');

    const unrelatedBuckets = ALL_NAMED_THROTTLERS.filter((name) => !ownBuckets.includes(name));
    for (const bucket of unrelatedBuckets) {
      const skip = reflector.getAllAndOverride<boolean | undefined>(THROTTLER_SKIP + bucket, [
        handler as (...args: unknown[]) => unknown,
        controller,
      ]);
      expect(skip).toBe(true);
    }
  });

  it('lists every currently-registered named throttler, so a newly-added bucket forces this file to be updated', () => {
    // If app.module.ts ever registers a new named throttler, this count should be bumped alongside
    // it — a silent mismatch here means new routes could ship without ever being audited against it.
    expect(ALL_NAMED_THROTTLERS).toHaveLength(7);
  });
});
