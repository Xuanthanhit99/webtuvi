import {
  dayKey,
  hrefForSource,
  priorityTierFor,
  renderEvidenceCard,
  renderEvidenceSourceItem,
  renderInsightCard,
  renderTimelineCard,
  toCategoryPresentation,
  toInsightReason,
  toPriorityBadge,
  toStatusPresentation,
  type RenderableInsightCandidate,
} from './insight-renderer';

function makeCandidate(overrides: Partial<RenderableInsightCandidate> = {}): RenderableInsightCandidate {
  return {
    id: 'insight-1',
    category: 'GOAL',
    status: 'READY',
    window: 'WEEK',
    windowStart: new Date('2026-01-01T00:00:00.000Z'),
    windowEnd: new Date('2026-01-05T00:00:00.000Z'),
    ruleExplanation: '2 reflections connected by SUPPORTS relationships.',
    priority: 60,
    priorityFactors: { frequency: 6, goalRelevance: 15 },
    pinned: false,
    createdAt: new Date('2026-01-05T12:00:00.000Z'),
    updatedAt: new Date('2026-01-05T12:00:00.000Z'),
    resolvedAt: null,
    evidenceCount: 2,
    relationshipCount: 1,
    ...overrides,
  };
}

describe('priorityTierFor / toPriorityBadge', () => {
  it('classifies LOW below 40, MEDIUM 40-69, HIGH >= 70 — reusing the readiness/singleton thresholds already in this codebase', () => {
    expect(priorityTierFor(0)).toBe('LOW');
    expect(priorityTierFor(39)).toBe('LOW');
    expect(priorityTierFor(40)).toBe('MEDIUM');
    expect(priorityTierFor(69)).toBe('MEDIUM');
    expect(priorityTierFor(70)).toBe('HIGH');
    expect(priorityTierFor(100)).toBe('HIGH');
  });

  it('badge carries the raw priority alongside the tier/label, never just the tier', () => {
    expect(toPriorityBadge(72)).toEqual({ tier: 'HIGH', label: 'High priority', priority: 72 });
  });
});

describe('toCategoryPresentation / toStatusPresentation', () => {
  it('never fabricates a label — every InsightCategory/InsightStatus has a fixed dictionary entry', () => {
    const categories: Parameters<typeof toCategoryPresentation>[0][] = ['GOAL', 'TOPIC', 'JOURNAL', 'WELLBEING', 'ALIGNMENT', 'MISMATCH', 'INACTIVITY'];
    for (const c of categories) expect(toCategoryPresentation(c).label).toBeTruthy();

    const statuses: Parameters<typeof toStatusPresentation>[0][] = ['NOT_READY', 'READY', 'INSUFFICIENT_EVIDENCE', 'ARCHIVED'];
    for (const s of statuses) expect(toStatusPresentation(s).label).toBeTruthy();
  });
});

describe('toInsightReason', () => {
  it('headline is always the candidate’s own ruleExplanation, never generated text', () => {
    const reason = toInsightReason('3 reflections connected by CONTINUES relationships.', {}, 3, 2);
    expect(reason.headline).toBe('3 reflections connected by CONTINUES relationships.');
  });

  it('whyItMatters is exactly explainInsightPriorityFactors(priorityFactors) — the same array the Sprint 4C API already returns', () => {
    const reason = toInsightReason('x', { frequency: 6, goalRelevance: 15 }, 2, 0);
    expect(reason.whyItMatters).toEqual(['Relates to a goal (+15).', 'Backed by multiple related reflections (+6).']);
  });

  it('handles null priorityFactors without throwing', () => {
    expect(toInsightReason('x', null, 1, 0).whyItMatters).toEqual([]);
  });

  it('evidenceSummary is a deterministic template over the counts, pluralized correctly', () => {
    expect(toInsightReason('x', {}, 1, 0).evidenceSummary).toBe('Backed by 1 reflection.');
    expect(toInsightReason('x', {}, 3, 0).evidenceSummary).toBe('Backed by 3 reflections.');
    expect(toInsightReason('x', {}, 3, 1).evidenceSummary).toBe('Backed by 3 reflections, connected by 1 relationship.');
    expect(toInsightReason('x', {}, 3, 2).evidenceSummary).toBe('Backed by 3 reflections, connected by 2 relationships.');
  });
});

describe('renderInsightCard', () => {
  it('renders every field from the input candidate, ISO-stringifying dates', () => {
    const card = renderInsightCard(makeCandidate());
    expect(card.id).toBe('insight-1');
    expect(card.category).toEqual({ value: 'GOAL', label: 'Goal' });
    expect(card.status).toEqual({ value: 'READY', label: 'Ready' });
    expect(card.windowStart).toBe('2026-01-01T00:00:00.000Z');
    expect(card.windowEnd).toBe('2026-01-05T00:00:00.000Z');
    expect(card.priorityBadge).toEqual({ tier: 'MEDIUM', label: 'Medium priority', priority: 60 });
    expect(card.evidenceCount).toBe(2);
    expect(card.relationshipCount).toBe(1);
    expect(card.pinned).toBe(false);
    expect(card.resolvedAt).toBeNull();
  });

  it('resolvedAt renders as an ISO string when set', () => {
    const card = renderInsightCard(makeCandidate({ resolvedAt: new Date('2026-01-06T00:00:00.000Z') }));
    expect(card.resolvedAt).toBe('2026-01-06T00:00:00.000Z');
  });

  it('is deterministic — same input always produces the same output', () => {
    const candidate = makeCandidate();
    expect(renderInsightCard(candidate)).toEqual(renderInsightCard(candidate));
  });
});

describe('dayKey / renderTimelineCard', () => {
  it('dayKey truncates to YYYY-MM-DD in UTC', () => {
    expect(dayKey(new Date('2026-01-05T23:59:59.000Z'))).toBe('2026-01-05');
  });

  it('renderTimelineCard extends the card with a day bucket derived from createdAt', () => {
    const card = renderTimelineCard(makeCandidate({ createdAt: new Date('2026-01-07T03:00:00.000Z') }));
    expect(card.day).toBe('2026-01-07');
  });
});

describe('hrefForSource / renderEvidenceSourceItem', () => {
  it('JOURNAL and MEMORY deep-link, ACTIVITY and COMPANION have no standalone detail view (mirrors ReflectionSourceViewer)', () => {
    expect(hrefForSource('JOURNAL', 'j1')).toBe('/journal?item=j1');
    expect(hrefForSource('MEMORY', 'm1')).toBe('/memory?item=m1');
    expect(hrefForSource('ACTIVITY', 'a1')).toBeNull();
    expect(hrefForSource('COMPANION', 'c1')).toBeNull();
  });

  it('an unavailable (deleted/stale) source never carries an href, even for a linkable type', () => {
    const item = renderEvidenceSourceItem('JOURNAL', 'j1', new Date('2026-01-01T00:00:00.000Z'), false);
    expect(item.available).toBe(false);
    expect(item.href).toBeNull();
  });

  it('an available JOURNAL/MEMORY source carries its real href', () => {
    const item = renderEvidenceSourceItem('MEMORY', 'm1', new Date('2026-01-01T00:00:00.000Z'), true);
    expect(item.available).toBe(true);
    expect(item.href).toBe('/memory?item=m1');
  });
});

describe('renderEvidenceCard', () => {
  it('always links to the real reflection detail view, regardless of source availability', () => {
    const card = renderEvidenceCard({
      reflectionCandidateId: 'r1',
      reflectionCategory: 'TOPIC',
      reflectionScore: 55,
      reflectionState: 'READY',
      contribution: 'Repeated topic, score 55.',
      sources: [],
    });
    expect(card.href).toBe('/reflections?item=r1');
    expect(card.contribution).toBe('Repeated topic, score 55.');
  });
});
