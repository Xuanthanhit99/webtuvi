import { NotificationsSchedulerService } from './notifications-scheduler.service';
import { dedupeKeyForTarotDailyReminder, getUtcDateKey } from '../eligibility/date-key.util';

const NOW = new Date('2026-08-13T09:00:00.000Z');
const DATE_KEY = getUtcDateKey(NOW);

interface Candidate {
  userId: string;
  email: string;
}

function makeHarness(options: {
  candidates: Candidate[];
  preferencesByUser?: Record<string, { reminderInApp: boolean; reminderEmail: boolean }>;
}) {
  async function* findEligibleBatches() {
    if (options.candidates.length > 0) yield options.candidates;
  }
  const tarotEligibility = { findEligibleBatches: jest.fn(findEligibleBatches) };

  const defaultPrefs = { reminderInApp: true, reminderEmail: false };
  const preferences = {
    resolve: jest.fn(async (userId: string) => options.preferencesByUser?.[userId] ?? defaultPrefs),
  };

  const createdDedupeKeys = new Set<string>();
  const notifications = {
    create: jest.fn(async (input: { userId: string; dedupeKey: string }) => {
      const key = `${input.userId}:${input.dedupeKey}`;
      const created = !createdDedupeKeys.has(key);
      createdDedupeKeys.add(key);
      return { notification: { id: `notif-${input.userId}`, ...input }, created };
    }),
  };

  const delivery = { deliverEmail: jest.fn(async () => undefined) };

  const scheduler = new NotificationsSchedulerService(tarotEligibility as never, preferences as never, notifications as never, delivery as never);
  return { scheduler, tarotEligibility, preferences, notifications, delivery };
}

describe('NotificationsSchedulerService.evaluateTarotDailyReminder', () => {
  it('NO_ACTION is the outcome for a user with reminderInApp disabled — no notification is created', async () => {
    const { scheduler, notifications } = makeHarness({
      candidates: [{ userId: 'u1', email: 'u1@example.com' }],
      preferencesByUser: { u1: { reminderInApp: false, reminderEmail: false } },
    });

    const result = await scheduler.evaluateTarotDailyReminder(NOW);

    expect(notifications.create).not.toHaveBeenCalled();
    expect(result).toEqual({ evaluated: 1, created: 0, emailed: 0, failed: 0 });
  });

  it('creates an in-app notification with the correct deterministic dedupeKey for an eligible, opted-in user', async () => {
    const { scheduler, notifications } = makeHarness({ candidates: [{ userId: 'u1', email: 'u1@example.com' }] });

    await scheduler.evaluateTarotDailyReminder(NOW);

    expect(notifications.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'u1', type: 'tarot.daily_reminder', dedupeKey: dedupeKeyForTarotDailyReminder(DATE_KEY) }),
    );
  });

  it('does not email when reminderEmail is false (the schema default)', async () => {
    const { scheduler, delivery } = makeHarness({ candidates: [{ userId: 'u1', email: 'u1@example.com' }] });
    await scheduler.evaluateTarotDailyReminder(NOW);
    expect(delivery.deliverEmail).not.toHaveBeenCalled();
  });

  it('emails only when reminderEmail is true, and only after a real (non-duplicate) creation', async () => {
    const { scheduler, delivery } = makeHarness({
      candidates: [{ userId: 'u1', email: 'u1@example.com' }],
      preferencesByUser: { u1: { reminderInApp: true, reminderEmail: true } },
    });

    const result = await scheduler.evaluateTarotDailyReminder(NOW);

    expect(delivery.deliverEmail).toHaveBeenCalledTimes(1);
    expect(result.emailed).toBe(1);
  });

  it('a duplicate create (already notified today) is a no-op and never triggers email, even with reminderEmail on', async () => {
    const { scheduler, notifications, delivery } = makeHarness({
      candidates: [{ userId: 'u1', email: 'u1@example.com' }],
      preferencesByUser: { u1: { reminderInApp: true, reminderEmail: true } },
    });
    // Simulate an already-existing notification for today by pre-seeding the dedupe set via a first run.
    await scheduler.evaluateTarotDailyReminder(NOW);
    notifications.create.mockClear();
    delivery.deliverEmail.mockClear();

    const second = await scheduler.evaluateTarotDailyReminder(NOW);

    expect(notifications.create).toHaveBeenCalledTimes(1); // still attempted (idempotent by design)
    expect(delivery.deliverEmail).not.toHaveBeenCalled(); // but not re-emailed
    expect(second.created).toBe(0);
    expect(second.emailed).toBe(0);
  });

  it('processes multiple candidates across the batch independently', async () => {
    const { scheduler } = makeHarness({
      candidates: [
        { userId: 'u1', email: 'u1@example.com' },
        { userId: 'u2', email: 'u2@example.com' },
      ],
    });

    const result = await scheduler.evaluateTarotDailyReminder(NOW);

    expect(result).toEqual({ evaluated: 2, created: 2, emailed: 0, failed: 0 });
  });

  it('yields all-NO_ACTION (zero created) when there are no eligible candidates at all — the expected default', async () => {
    const { scheduler } = makeHarness({ candidates: [] });
    const result = await scheduler.evaluateTarotDailyReminder(NOW);
    expect(result).toEqual({ evaluated: 0, created: 0, emailed: 0, failed: 0 });
  });

  it('a candidate that throws mid-evaluation is isolated — logged, counted as failed, and does not abort the rest of the batch', async () => {
    const { scheduler, preferences, notifications } = makeHarness({
      candidates: [
        { userId: 'u1', email: 'u1@example.com' },
        { userId: 'u2', email: 'u2@example.com' },
      ],
    });
    preferences.resolve.mockImplementationOnce(async () => {
      throw new Error('transient db blip');
    });
    const loggerErrorSpy = jest.spyOn((scheduler as unknown as { logger: { error: jest.Mock } }).logger, 'error');

    const result = await scheduler.evaluateTarotDailyReminder(NOW);

    expect(result.evaluated).toBe(2);
    expect(result.failed).toBe(1);
    expect(result.created).toBe(1); // u2 still processed successfully despite u1's failure
    expect(notifications.create).toHaveBeenCalledTimes(1);
    expect(notifications.create).toHaveBeenCalledWith(expect.objectContaining({ userId: 'u2' }));
    expect(loggerErrorSpy).toHaveBeenCalledWith(expect.stringContaining('candidate_failed'));
    // Never logs the candidate's email or any notification content.
    const loggedMessage = loggerErrorSpy.mock.calls[0]?.[0] as string;
    expect(loggedMessage).not.toContain('@example.com');
    expect(loggedMessage).not.toContain("Today's card is ready");
    loggerErrorSpy.mockRestore();
  });

  it('runTarotDailyReminder (the @Cron entry point) never throws, even when evaluation fails entirely — logs and returns cleanly', async () => {
    const { scheduler, tarotEligibility } = makeHarness({ candidates: [] });
    tarotEligibility.findEligibleBatches.mockImplementation(() => {
      throw new Error('eligibility query failed');
    });
    const loggerErrorSpy = jest.spyOn((scheduler as unknown as { logger: { error: jest.Mock } }).logger, 'error');

    await expect(scheduler.runTarotDailyReminder()).resolves.toBeUndefined();

    expect(loggerErrorSpy).toHaveBeenCalledWith(expect.stringContaining('run_failed'), expect.anything());
    loggerErrorSpy.mockRestore();
  });

  it('a run failure does not create a duplicate notification on a later successful run for the same day', async () => {
    const { scheduler, preferences, notifications } = makeHarness({
      candidates: [{ userId: 'u1', email: 'u1@example.com' }],
    });
    preferences.resolve.mockImplementationOnce(async () => {
      throw new Error('transient failure');
    });
    const first = await scheduler.evaluateTarotDailyReminder(NOW);
    expect(first.failed).toBe(1);
    expect(first.created).toBe(0);

    const second = await scheduler.evaluateTarotDailyReminder(NOW);

    expect(second.created).toBe(1);
    expect(notifications.create).toHaveBeenCalledTimes(1); // only the successful second attempt ever created a row
  });
});
