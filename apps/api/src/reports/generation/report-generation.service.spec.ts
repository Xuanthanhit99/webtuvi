import { ForbiddenException } from '@nestjs/common';
import { ReportGenerationInProgressError, ReportGenerationService, ReportSourcesNotReadyError } from './report-generation.service';
import type { ReportSourceSnapshot } from '../reports.types';

const READY_SNAPSHOT: ReportSourceSnapshot = {
  natalChart: {
    sourceId: 'natal-1',
    calculationVersion: 'v1',
    engineVersion: 'v1',
    ascendant: null,
    midheaven: null,
    placements: [{ body: 'SUN', sign: 'ARIES', degreeInSign: 5, house: 1, retrograde: false, meaning: 'Sun in Aries' }],
    aspects: [],
  },
  numerology: { sourceId: 'num-1', calculationVersion: 'v1', values: [{ type: 'LIFE_PATH', value: 7, isMasterNumber: false, meaning: 'Life Path 7' }] },
  tarot: null,
  memory: null,
};

const VALID_STRUCTURED_JSON = JSON.stringify({
  overview: 'Overview text.',
  coreIdentity: { narrative: 'Core identity.', evidenceRefs: ['natalChart:placement:SUN'] },
  strengths: [{ title: 'Strength', narrative: 'A strength.', evidenceRefs: ['numerology:LIFE_PATH'] }],
  growthAreas: [{ title: 'Growth', narrative: 'A growth area.', evidenceRefs: ['natalChart:placement:SUN'] }],
  relationships: { narrative: 'Relationships.', evidenceRefs: ['natalChart:placement:SUN'] },
  careerDirection: { narrative: 'Career.', evidenceRefs: ['numerology:LIFE_PATH'] },
  currentThemes: null,
  personalizedReflection: null,
  sourceHighlights: [{ source: 'numerology', fact: 'fact' }],
  methodology: 'This report combines calculation and AI narrative.',
});

function makeDeps(overrides: Partial<Record<string, unknown>> = {}) {
  const destinyReportRows: Record<string, unknown> = {};
  const prisma = {
    destinyReport: {
      create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const row = { id: 'report-1', createdAt: new Date(), completedAt: null, ...data };
        destinyReportRows[row.id as string] = row;
        return row;
      }),
      update: jest.fn(async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const row = { ...(destinyReportRows[where.id] as Record<string, unknown>), ...data };
        destinyReportRows[where.id] = row;
        return row;
      }),
    },
  };

  const entitlementService = { requirePremium: jest.fn(async () => undefined) };
  const readiness = { check: jest.fn(async () => ({ ready: true, natalChart: { available: true, sourceId: 'natal-1' }, numerology: { available: true, sourceId: 'num-1' }, tarot: { available: false, count: 0 }, memory: { available: false } })) };
  const snapshotService = { build: jest.fn(async () => READY_SNAPSHOT) };
  const costControl = { checkBudget: jest.fn(async () => ({ allowed: true })), record: jest.fn(async () => 0.001) };
  const generationLock = { tryAcquireDiscovery: jest.fn(async () => true), releaseDiscovery: jest.fn(async () => undefined) };
  const orchestrator = {
    stream: jest.fn(async function* () {
      yield { type: 'token', content: VALID_STRUCTURED_JSON };
      yield { type: 'done', usage: { promptTokens: 10, completionTokens: 10, totalTokens: 20 }, model: 'mock-model', provider: 'mock' };
    }),
  };
  const safety = { checkInput: jest.fn(() => ({ allowed: true, category: 'none' })), checkOutput: jest.fn(() => ({ allowed: true, category: 'none' })) };
  const observability = { logUsage: jest.fn() };
  const analyticsService = { trackServerEvent: jest.fn(async () => undefined) };

  return {
    prisma,
    entitlementService,
    readiness,
    snapshotService,
    costControl,
    generationLock,
    orchestrator,
    safety,
    observability,
    analyticsService,
    ...overrides,
  };
}

function makeService(deps: ReturnType<typeof makeDeps>) {
  return new ReportGenerationService(
    deps.prisma as never,
    deps.entitlementService as never,
    deps.readiness as never,
    deps.snapshotService as never,
    deps.costControl as never,
    deps.generationLock as never,
    deps.orchestrator as never,
    deps.safety as never,
    deps.observability as never,
    deps.analyticsService as never,
  );
}

describe('ReportGenerationService', () => {
  it('requires Premium before doing anything else', async () => {
    const deps = makeDeps({ entitlementService: { requirePremium: jest.fn(async () => { throw new ForbiddenException({ code: 'PREMIUM_REQUIRED' }); }) } });
    const service = makeService(deps);
    await expect(service.generate('user-1')).rejects.toThrow(ForbiddenException);
    expect(deps.readiness.check).not.toHaveBeenCalled();
  });

  it('refuses to generate a partial report when a required source is missing (no partial report)', async () => {
    const deps = makeDeps({
      readiness: { check: jest.fn(async () => ({ ready: false, natalChart: { available: true, sourceId: 'natal-1' }, numerology: { available: false, sourceId: null }, tarot: { available: false, count: 0 }, memory: { available: false } })) },
    });
    const service = makeService(deps);
    await expect(service.generate('user-1')).rejects.toThrow(ReportSourcesNotReadyError);
    expect(deps.snapshotService.build).not.toHaveBeenCalled();
  });

  it('blocks generation honestly when the shared AI budget is exceeded', async () => {
    const deps = makeDeps({ costControl: { checkBudget: jest.fn(async () => ({ allowed: false, reason: 'daily_token_limit', message: 'Budget exceeded' })), record: jest.fn() } });
    const service = makeService(deps);
    await expect(service.generate('user-1')).rejects.toThrow(ForbiddenException);
  });

  it('rejects a duplicate concurrent generation via the shared generation lock (idempotency)', async () => {
    const deps = makeDeps({ generationLock: { tryAcquireDiscovery: jest.fn(async () => false), releaseDiscovery: jest.fn() } });
    const service = makeService(deps);
    await expect(service.generate('user-1')).rejects.toThrow(ReportGenerationInProgressError);
  });

  it('always releases the generation lock, even on success', async () => {
    const deps = makeDeps();
    const service = makeService(deps);
    await service.generate('user-1');
    expect(deps.generationLock.releaseDiscovery).toHaveBeenCalledWith('reports', 'user-1', 'generate');
  });

  it('marks the report FAILED with PROVIDER_UNAVAILABLE when the AI provider errors, never a fabricated report', async () => {
    const deps = makeDeps({
      orchestrator: {
        stream: jest.fn(async function* () {
          yield { type: 'error', message: 'boom', retryable: false, code: 'PROVIDER_UNAVAILABLE' };
        }),
      },
    });
    const service = makeService(deps);
    const result = await service.generate('user-1');
    expect(result.status).toBe('FAILED');
    expect(result.failureReason).toBe('PROVIDER_UNAVAILABLE');
    expect(result.result).toBeNull();
  });

  it('marks the report FAILED with SAFETY_REFUSED when output safety check rejects the content', async () => {
    const deps = makeDeps({ safety: { checkInput: jest.fn(() => ({ allowed: true, category: 'none' })), checkOutput: jest.fn(() => ({ allowed: false, category: 'unsafe_content', refusalMessage: 'refused' })) } });
    const service = makeService(deps);
    const result = await service.generate('user-1');
    expect(result.status).toBe('FAILED');
    expect(result.failureReason).toBe('SAFETY_REFUSED');
  });

  it('marks the report FAILED with VALIDATION_FAILED after malformed AI output survives all retries — never persists malformed output as READY', async () => {
    const deps = makeDeps({
      orchestrator: {
        stream: jest.fn(async function* () {
          yield { type: 'token', content: 'not valid json at all' };
          yield { type: 'done', usage: { promptTokens: 5, completionTokens: 5, totalTokens: 10 }, model: 'mock-model', provider: 'mock' };
        }),
      },
    });
    const service = makeService(deps);
    const result = await service.generate('user-1');
    expect(result.status).toBe('FAILED');
    expect(result.failureReason).toBe('VALIDATION_FAILED');
    // Retried once per MAX_SCHEMA_VALIDATION_ATTEMPTS, not looped indefinitely.
    expect(deps.orchestrator.stream).toHaveBeenCalledTimes(2);
  });

  it('marks the report FAILED with VALIDATION_FAILED when the AI cites an evidence reference not present in the snapshot (grounding violation)', async () => {
    const ungroundedJson = JSON.stringify({
      overview: 'Overview.',
      coreIdentity: { narrative: 'Fabricated.', evidenceRefs: ['natalChart:placement:MOON'] },
      strengths: [{ title: 'S', narrative: 'n', evidenceRefs: [] }],
      growthAreas: [{ title: 'G', narrative: 'n', evidenceRefs: [] }],
      relationships: { narrative: 'n', evidenceRefs: [] },
      careerDirection: { narrative: 'n', evidenceRefs: [] },
      currentThemes: null,
      personalizedReflection: null,
      sourceHighlights: [{ source: 's', fact: 'f' }],
      methodology: 'm',
    });
    const deps = makeDeps({
      orchestrator: {
        stream: jest.fn(async function* () {
          yield { type: 'token', content: ungroundedJson };
          yield { type: 'done', usage: { promptTokens: 5, completionTokens: 5, totalTokens: 10 }, model: 'mock-model', provider: 'mock' };
        }),
      },
    });
    const service = makeService(deps);
    const result = await service.generate('user-1');
    expect(result.status).toBe('FAILED');
    expect(result.failureReason).toBe('VALIDATION_FAILED');
  });

  it('persists a READY report with the structured result on success, and records AIUsage', async () => {
    const deps = makeDeps();
    const service = makeService(deps);
    const result = await service.generate('user-1');
    expect(result.status).toBe('READY');
    expect(result.result).not.toBeNull();
    expect(result.result?.overview).toBe('Overview text.');
    expect(deps.costControl.record).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user-1', feature: 'reports' }));
  });

  it('tracks report_generation_completed on success and report_generation_failed on failure (never report_generation_started server-side — that is a client event)', async () => {
    const deps = makeDeps();
    const service = makeService(deps);
    await service.generate('user-1');
    const events = deps.analyticsService.trackServerEvent.mock.calls.map((call: unknown[]) => (call[0] as { event: string }).event);
    expect(events).toContain('report_generation_completed');
    expect(events).not.toContain('report_generation_started');
  });

  it('this module never imports Journal, Reflection, Insight, Review, or Goal services (frozen modules excluded by construction, not just convention)', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const source = require('fs').readFileSync(require.resolve('./report-generation.service.ts'), 'utf-8') as string;
    for (const forbidden of ['journal', 'reflection', 'insight', 'review', 'goal']) {
      expect(source.toLowerCase()).not.toContain(`'../../${forbidden}`);
    }
  });
});
