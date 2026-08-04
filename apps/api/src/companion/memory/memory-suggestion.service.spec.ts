import { MemorySuggestionService } from './memory-suggestion.service';

const OWNER = 'user-1';

function makeConsentMock(mode: string) {
  return { resolveMode: jest.fn(async () => mode) };
}

function makeAuditMock() {
  return { record: jest.fn(async () => undefined) };
}

describe('MemorySuggestionService.evaluate', () => {
  it('returns null when the detector finds nothing', async () => {
    const service = new MemorySuggestionService(makeConsentMock('ASK_EVERY_TIME') as never, makeAuditMock() as never);
    const result = await service.evaluate(OWNER, 'ok');
    expect(result).toBeNull();
  });

  it('returns a suggestion when the detector matches and consent currently allows it', async () => {
    const service = new MemorySuggestionService(makeConsentMock('ASK_EVERY_TIME') as never, makeAuditMock() as never);
    const result = await service.evaluate(OWNER, 'My goal is to learn Japanese fluently');
    expect(result).toEqual({
      type: 'GOAL',
      title: 'My goal is to learn Japanese fluently',
      summary: 'My goal is to learn Japanese fluently',
      reason: 'This sounds like a goal you have.',
    });
  });

  it('suppresses the suggestion when the user has set that type to DENY_TYPE ("Never remember this type")', async () => {
    const service = new MemorySuggestionService(makeConsentMock('DENY_TYPE') as never, makeAuditMock() as never);
    const result = await service.evaluate(OWNER, 'My goal is to learn Japanese fluently');
    expect(result).toBeNull();
  });

  it('suppresses the suggestion when memory is globally DISABLED', async () => {
    const service = new MemorySuggestionService(makeConsentMock('DISABLED') as never, makeAuditMock() as never);
    const result = await service.evaluate(OWNER, 'My goal is to learn Japanese fluently');
    expect(result).toBeNull();
  });

  it('still suggests when consent is ALLOW_TYPE or ALLOW_SELECTED', async () => {
    for (const mode of ['ALLOW_TYPE', 'ALLOW_SELECTED']) {
      const service = new MemorySuggestionService(makeConsentMock(mode) as never, makeAuditMock() as never);
      const result = await service.evaluate(OWNER, 'My goal is to learn Japanese fluently');
      expect(result).not.toBeNull();
    }
  });
});

describe('MemorySuggestionService.dismiss', () => {
  it('records a REJECTED audit entry with no memoryId and a source marker, never creating a candidate', async () => {
    const audit = makeAuditMock();
    const service = new MemorySuggestionService(makeConsentMock('ASK_EVERY_TIME') as never, audit as never);

    await service.dismiss(OWNER, 'GOAL');

    expect(audit.record).toHaveBeenCalledWith({
      userId: OWNER,
      action: 'REJECTED',
      metadata: { source: 'suggestion_dismissed', type: 'GOAL' },
    });
  });
});
