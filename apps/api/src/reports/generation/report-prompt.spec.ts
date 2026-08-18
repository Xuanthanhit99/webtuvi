import { collectValidEvidenceRefs, findGroundingViolations } from './report-prompt';
import type { ReportSourceSnapshot, ReportStructuredResult } from '../reports.types';

function makeSnapshot(overrides: Partial<ReportSourceSnapshot> = {}): ReportSourceSnapshot {
  return {
    natalChart: {
      sourceId: 'natal-1',
      calculationVersion: 'v1',
      engineVersion: 'v1',
      ascendant: { sign: 'Leo', degreeInSign: 10 },
      midheaven: null,
      placements: [{ body: 'SUN', sign: 'Aries', degreeInSign: 5, house: 1, retrograde: false, meaning: 'Sun in Aries' }],
      aspects: [],
    },
    numerology: {
      sourceId: 'num-1',
      calculationVersion: 'v1',
      values: [{ type: 'LIFE_PATH', value: 7, isMasterNumber: false, meaning: 'Life Path 7' }],
    },
    tarot: null,
    memory: null,
    ...overrides,
  };
}

function makeResult(overrides: Partial<ReportStructuredResult> = {}): ReportStructuredResult {
  return {
    overview: 'An overview.',
    coreIdentity: { narrative: 'Core identity narrative.', evidenceRefs: ['natalChart:placement:SUN', 'numerology:LIFE_PATH'] },
    strengths: [{ title: 'Strength', narrative: 'A strength.', evidenceRefs: ['numerology:LIFE_PATH'] }],
    growthAreas: [{ title: 'Growth', narrative: 'A growth area.', evidenceRefs: ['natalChart:placement:SUN'] }],
    relationships: { narrative: 'Relationships narrative.', evidenceRefs: ['natalChart:ascendant'] },
    careerDirection: { narrative: 'Career narrative.', evidenceRefs: ['numerology:LIFE_PATH'] },
    currentThemes: null,
    personalizedReflection: null,
    sourceHighlights: [{ source: 'numerology', fact: 'Life Path 7' }],
    methodology: 'This report combines calculation and AI narrative.',
    ...overrides,
  };
}

describe('collectValidEvidenceRefs', () => {
  it('includes every natal placement, ascendant/midheaven, aspect, and numerology value as a valid reference', () => {
    const refs = collectValidEvidenceRefs(makeSnapshot());
    expect(refs.has('natalChart:placement:SUN')).toBe(true);
    expect(refs.has('natalChart:ascendant')).toBe(true);
    expect(refs.has('natalChart:midheaven')).toBe(false); // null in this snapshot
    expect(refs.has('numerology:LIFE_PATH')).toBe(true);
  });

  it('includes tarot/memory references only when present in the snapshot', () => {
    const withTarot = collectValidEvidenceRefs(
      makeSnapshot({ tarot: [{ sourceId: 't1', drawnAt: '2026-01-01', type: 'SINGLE_CARD', cards: [] }] }),
    );
    expect(withTarot.has('tarot:0')).toBe(true);

    const withoutTarot = collectValidEvidenceRefs(makeSnapshot());
    expect(withoutTarot.has('tarot:0')).toBe(false);
  });
});

describe('findGroundingViolations', () => {
  it('returns no violations for a fully grounded result', () => {
    expect(findGroundingViolations(makeResult(), makeSnapshot())).toEqual([]);
  });

  it('flags an evidence reference that does not exist in the snapshot (the core hallucination-prevention check)', () => {
    const result = makeResult({
      coreIdentity: { narrative: 'Fabricated.', evidenceRefs: ['natalChart:placement:MOON'] },
    });
    const violations = findGroundingViolations(result, makeSnapshot());
    expect(violations.some((v) => v.includes('natalChart:placement:MOON'))).toBe(true);
  });

  it('flags currentThemes populated when the snapshot has no Tarot context (never invented from nothing)', () => {
    const result = makeResult({ currentThemes: { narrative: 'Fabricated Tarot theme.', evidenceRefs: ['numerology:LIFE_PATH'] } });
    const violations = findGroundingViolations(result, makeSnapshot());
    expect(violations.some((v) => v.includes('currentThemes'))).toBe(true);
  });

  it('flags personalizedReflection populated when the snapshot has no Memory context', () => {
    const result = makeResult({ personalizedReflection: { narrative: 'Fabricated memory.', evidenceRefs: ['numerology:LIFE_PATH'] } });
    const violations = findGroundingViolations(result, makeSnapshot());
    expect(violations.some((v) => v.includes('personalizedReflection'))).toBe(true);
  });

  it('allows currentThemes/personalizedReflection when their source actually exists in the snapshot', () => {
    const snapshot = makeSnapshot({
      tarot: [{ sourceId: 't1', drawnAt: '2026-01-01', type: 'SINGLE_CARD', cards: [] }],
      memory: [{ title: 'A memory', summary: 'Summary' }],
    });
    const result = makeResult({
      currentThemes: { narrative: 'Real theme.', evidenceRefs: ['tarot:0'] },
      personalizedReflection: { narrative: 'Real reflection.', evidenceRefs: ['memory:0'] },
    });
    expect(findGroundingViolations(result, snapshot)).toEqual([]);
  });
});
