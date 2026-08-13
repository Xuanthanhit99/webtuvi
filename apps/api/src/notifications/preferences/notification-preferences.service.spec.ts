import { NotificationPreferencesService } from './notification-preferences.service';

function makePrismaMock() {
  const rows = new Map<string, { userId: string; reminderInApp: boolean; reminderEmail: boolean }>();
  const notificationPreference = {
    findUnique: jest.fn(async ({ where }: { where: { userId: string } }) => rows.get(where.userId) ?? null),
    upsert: jest.fn(
      async ({
        where,
        create,
        update,
      }: {
        where: { userId: string };
        create: { userId: string; reminderInApp: boolean; reminderEmail: boolean };
        update: { reminderInApp: boolean; reminderEmail: boolean };
      }) => {
        const existing = rows.get(where.userId);
        const row = existing ? { ...existing, ...update } : { ...create };
        rows.set(where.userId, row);
        return row;
      },
    ),
  };
  return { notificationPreference, rows };
}

describe('NotificationPreferencesService.resolve', () => {
  it('returns schema defaults without writing a row for a user who never saved preferences', async () => {
    const { notificationPreference } = makePrismaMock();
    const service = new NotificationPreferencesService({ notificationPreference } as never);

    const result = await service.resolve('user-1');

    expect(result).toEqual({ reminderInApp: true, reminderEmail: false });
    expect(notificationPreference.upsert).not.toHaveBeenCalled();
  });

  it('returns the saved row once one exists', async () => {
    const { notificationPreference, rows } = makePrismaMock();
    rows.set('user-1', { userId: 'user-1', reminderInApp: false, reminderEmail: true });
    const service = new NotificationPreferencesService({ notificationPreference } as never);

    await expect(service.resolve('user-1')).resolves.toEqual({ reminderInApp: false, reminderEmail: true });
  });
});

describe('NotificationPreferencesService.update', () => {
  it('creates a row on first update, applying only the supplied fields over the defaults', async () => {
    const { notificationPreference } = makePrismaMock();
    const service = new NotificationPreferencesService({ notificationPreference } as never);

    const result = await service.update('user-1', { reminderEmail: true });

    expect(result).toEqual({ reminderInApp: true, reminderEmail: true });
  });

  it('a partial update on an existing row leaves the other field unchanged', async () => {
    const { notificationPreference, rows } = makePrismaMock();
    rows.set('user-1', { userId: 'user-1', reminderInApp: true, reminderEmail: true });
    const service = new NotificationPreferencesService({ notificationPreference } as never);

    const result = await service.update('user-1', { reminderInApp: false });

    expect(result).toEqual({ reminderInApp: false, reminderEmail: true });
  });

  it('an empty patch is a no-op that still returns the current (or default) values', async () => {
    const { notificationPreference } = makePrismaMock();
    const service = new NotificationPreferencesService({ notificationPreference } as never);

    await expect(service.update('user-1', {})).resolves.toEqual({ reminderInApp: true, reminderEmail: false });
  });
});
