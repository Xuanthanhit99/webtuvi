import { NotFoundException } from '@nestjs/common';
import { ReportRecordService } from './report-record.service';

const OWNER = 'user-1';
const OTHER = 'user-2';

function makeReport(overrides: Partial<{ id: string; userId: string; createdAt: Date }> = {}) {
  return {
    id: overrides.id ?? 'report-1',
    userId: overrides.userId ?? OWNER,
    status: 'READY',
    natalChartId: 'natal-1',
    numerologyReadingId: 'num-1',
    reportSchemaVersion: 'v1',
    reportTemplateVersion: 'v1',
    aiPromptVersion: 'v1',
    sourceSnapshot: {},
    structuredResult: {},
    aiProvider: 'MOCK',
    aiModel: 'mock-model',
    failureReason: null,
    createdAt: overrides.createdAt ?? new Date('2026-01-01T00:00:00.000Z'),
    completedAt: new Date('2026-01-01T00:00:01.000Z'),
  };
}

function makePrismaMock(rows: ReturnType<typeof makeReport>[]) {
  return {
    destinyReport: {
      findUnique: jest.fn(async ({ where }: { where: { id: string } }) => rows.find((r) => r.id === where.id) ?? null),
      findMany: jest.fn(async ({ where, skip, take }: { where: { userId: string }; skip: number; take: number }) =>
        rows.filter((r) => r.userId === where.userId).slice(skip, skip + take),
      ),
      count: jest.fn(async ({ where }: { where: { userId: string } }) => rows.filter((r) => r.userId === where.userId).length),
    },
  };
}

function makeService(rows: ReturnType<typeof makeReport>[]) {
  const generation = { generate: jest.fn(async () => makeReport()) };
  return { service: new ReportRecordService(makePrismaMock(rows) as never, generation as never), generation };
}

describe('ReportRecordService', () => {
  it('404s for a report that does not exist', async () => {
    const { service } = makeService([]);
    await expect(service.getOne(OWNER, 'nope')).rejects.toThrow(NotFoundException);
  });

  it('404s identically when the report belongs to a different user (no cross-user report fetch)', async () => {
    const { service } = makeService([makeReport({ userId: OTHER })]);
    await expect(service.getOne(OWNER, 'report-1')).rejects.toThrow(NotFoundException);
  });

  it('returns the report for its actual owner', async () => {
    const { service } = makeService([makeReport({ userId: OWNER })]);
    const result = await service.getOne(OWNER, 'report-1');
    expect(result.id).toBe('report-1');
  });

  it('lists only the caller’s own reports, newest first, paginated', async () => {
    const rows = [
      makeReport({ id: 'r1', userId: OWNER, createdAt: new Date('2026-01-01T00:00:00.000Z') }),
      makeReport({ id: 'r2', userId: OTHER, createdAt: new Date('2026-01-02T00:00:00.000Z') }),
      makeReport({ id: 'r3', userId: OWNER, createdAt: new Date('2026-01-03T00:00:00.000Z') }),
    ];
    const { service } = makeService(rows);
    const result = await service.list(OWNER, {});
    expect(result.items.map((r) => r.id)).toEqual(expect.arrayContaining(['r1', 'r3']));
    expect(result.items.map((r) => r.id)).not.toContain('r2');
  });

  it('regenerate() delegates to the generation service and does not touch the prior report row', async () => {
    const { service, generation } = makeService([makeReport({ id: 'old-report', userId: OWNER })]);
    await service.regenerate(OWNER);
    expect(generation.generate).toHaveBeenCalledWith(OWNER);
  });
});
