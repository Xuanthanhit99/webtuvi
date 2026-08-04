import { MemoryEvaluationService } from './memory-evaluation.service';
import { RETRIEVAL_SCENARIOS, DUPLICATE_PAIR_FIXTURES, CONFLICT_PAIR_FIXTURES } from './evaluation.fixtures';

describe('MemoryEvaluationService', () => {
  const service = new MemoryEvaluationService();

  it('produces one retrieval result per fixture scenario', () => {
    const report = service.run();
    expect(report.retrieval.scenarios).toHaveLength(RETRIEVAL_SCENARIOS.length);
  });

  it('achieves perfect precision/recall on every hand-labeled retrieval fixture', () => {
    // These fixtures were designed so the deterministic algorithm's known behavior (pin >
    // importance > goal-relation > recency > frequency, with a fallback for unmatched context)
    // produces exactly the expected set — a regression here means the algorithm's actual
    // behavior silently diverged from what the fixtures assert it should do.
    const report = service.run();
    for (const scenario of report.retrieval.scenarios) {
      expect(scenario.precision).toBe(1);
      expect(scenario.recall).toBe(1);
    }
  });

  it('reports duplicate detection accuracy of 100% against its own hand-labeled fixtures', () => {
    const report = service.run();
    expect(report.duplicateDetection.pairsChecked).toBe(DUPLICATE_PAIR_FIXTURES.length);
    expect(report.duplicateDetection.accuracyAgainstLabels).toBe(1);
  });

  it('reports conflict detection accuracy of 100% against its own hand-labeled fixtures', () => {
    const report = service.run();
    expect(report.conflictDetection.pairsChecked).toBe(CONFLICT_PAIR_FIXTURES.length);
    expect(report.conflictDetection.accuracyAgainstLabels).toBe(1);
  });

  it('derives the merge suggestion rate from duplicates found', () => {
    const report = service.run();
    expect(report.mergeSuggestions.duplicatesFound).toBe(report.duplicateDetection.duplicatesFound);
    expect(report.mergeSuggestions.mergeSuggestionRate).toBe(report.duplicateDetection.duplicatesFound > 0 ? 1 : 0);
  });

  it('measures a non-negative latency for every scenario', () => {
    const report = service.run();
    for (const scenario of report.retrieval.scenarios) {
      expect(scenario.latencyMs).toBeGreaterThanOrEqual(0);
    }
  });

  it('is deterministic across repeated runs', () => {
    const first = service.run();
    const second = service.run();
    expect(first.retrieval.averagePrecision).toBe(second.retrieval.averagePrecision);
    expect(first.duplicateDetection.duplicateRate).toBe(second.duplicateDetection.duplicateRate);
  });
});
