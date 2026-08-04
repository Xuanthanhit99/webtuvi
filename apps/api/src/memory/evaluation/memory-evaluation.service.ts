import { Injectable } from '@nestjs/common';
import { classifyDuplicate } from '../duplicate/memory-duplicate.util';
import { classifyConflict } from '../conflict/memory-conflict.util';
import { rankMemories } from '../retrieval/memory-ranking.util';
import { toRankable, filterByContext } from '../retrieval/memory-retrieval.service';
import { ContextBudgetService } from '../budget/context-budget.service';
import { DUPLICATE_PAIR_FIXTURES, CONFLICT_PAIR_FIXTURES, RETRIEVAL_SCENARIOS, type RetrievalScenario } from './evaluation.fixtures';

export interface RetrievalScenarioResult {
  name: string;
  precision: number;
  recall: number;
  retrievedCount: number;
  latencyMs: number;
  tokenUsageRatio: number;
}

export interface EvaluationReport {
  generatedAt: string;
  retrieval: {
    scenarios: RetrievalScenarioResult[];
    averagePrecision: number;
    averageRecall: number;
    averageRetrievedCount: number;
    averageLatencyMs: number;
    averageTokenUsageRatio: number;
  };
  duplicateDetection: {
    pairsChecked: number;
    duplicatesFound: number;
    duplicateRate: number;
    accuracyAgainstLabels: number;
  };
  conflictDetection: {
    pairsChecked: number;
    conflictsFound: number;
    accuracyAgainstLabels: number;
  };
  mergeSuggestions: {
    duplicatesFound: number;
    suggestionsWouldBeGenerated: number;
    mergeSuggestionRate: number;
  };
}

/**
 * Evaluation tooling for Phase 8. Runs the *actual* production algorithms (classifyDuplicate,
 * classifyConflict, rankMemories, filterByContext, ContextBudgetService) against small,
 * hand-labeled, checked-in fixtures (see evaluation.fixtures.ts) — chosen over live production
 * data because no live database was reachable this session and no real usage data exists yet
 * for this sprint's brand-new features. See docs/architecture/memory-intelligence.md
 * "Evaluation methodology" for the full disclosure of what this can and can't tell you.
 */
@Injectable()
export class MemoryEvaluationService {
  private readonly budget = new ContextBudgetService({
    get: () => ({
      memory: {
        contextBudget: { totalWindowTokens: 8000, reservedOutputTokens: 1024, conversationMaxTokens: 3000, memoryMaxTokens: 1500 },
      },
    }),
  } as never);

  run(): EvaluationReport {
    const retrievalResults = RETRIEVAL_SCENARIOS.map((scenario) => this.evaluateRetrievalScenario(scenario));

    const duplicateEval = this.evaluateDuplicates();
    const conflictEval = this.evaluateConflicts();

    return {
      generatedAt: new Date().toISOString(),
      retrieval: {
        scenarios: retrievalResults,
        averagePrecision: average(retrievalResults.map((r) => r.precision)),
        averageRecall: average(retrievalResults.map((r) => r.recall)),
        averageRetrievedCount: average(retrievalResults.map((r) => r.retrievedCount)),
        averageLatencyMs: average(retrievalResults.map((r) => r.latencyMs)),
        averageTokenUsageRatio: average(retrievalResults.map((r) => r.tokenUsageRatio)),
      },
      duplicateDetection: duplicateEval,
      conflictDetection: conflictEval,
      mergeSuggestions: {
        duplicatesFound: duplicateEval.duplicatesFound,
        // This sprint's MemoryMergeSuggestionService generates exactly one suggestion per
        // PENDING duplicate pair with no prior suggestion (see its "already exists" guard) —
        // so under fresh fixtures (no pre-existing suggestions) this rate is definitionally 1.0.
        // Reported explicitly rather than hidden, since a rate that can only ever be 1.0 or 0.0
        // given the current design is itself a disclosed fact about the algorithm, not a
        // meaningful discriminating metric yet — see "Known limitations".
        suggestionsWouldBeGenerated: duplicateEval.duplicatesFound,
        mergeSuggestionRate: duplicateEval.duplicatesFound > 0 ? 1 : 0,
      },
    };
  }

  private evaluateRetrievalScenario(scenario: RetrievalScenario): RetrievalScenarioResult {
    const startedAt = performance.now();

    const filtered = filterByContext(scenario.memories, scenario.contextText);
    const ranked = rankMemories(filtered.map(toRankable));
    const budget = this.budget.computeBudget({});
    const idToMemory = new Map(scenario.memories.map((m) => [m.id, m]));
    const fit = this.budget.fitToBudget(
      ranked.map((r) => ({ id: r.id, text: `${idToMemory.get(r.id)!.title} ${idToMemory.get(r.id)!.summary}` })),
      budget.memoryTokens,
    );
    const limit = scenario.limit ?? fit.included.length;
    const retrievedIds = fit.included.slice(0, limit).map((i) => i.id);

    const latencyMs = performance.now() - startedAt;

    const expected = new Set(scenario.expectedRelevantIds);
    const retrieved = new Set(retrievedIds);
    const truePositives = [...retrieved].filter((id) => expected.has(id)).length;

    return {
      name: scenario.name,
      precision: retrieved.size === 0 ? 0 : truePositives / retrieved.size,
      recall: expected.size === 0 ? 0 : truePositives / expected.size,
      retrievedCount: retrievedIds.length,
      latencyMs,
      tokenUsageRatio: budget.memoryTokens === 0 ? 0 : fit.tokenUsed / budget.memoryTokens,
    };
  }

  private evaluateDuplicates() {
    let duplicatesFound = 0;
    let correct = 0;
    for (const pair of DUPLICATE_PAIR_FIXTURES) {
      const match = classifyDuplicate(toDuplicateCandidate(pair.a), toDuplicateCandidate(pair.b));
      const predicted = match !== null;
      if (predicted) duplicatesFound += 1;
      if (predicted === pair.expectedDuplicate) correct += 1;
    }
    return {
      pairsChecked: DUPLICATE_PAIR_FIXTURES.length,
      duplicatesFound,
      duplicateRate: DUPLICATE_PAIR_FIXTURES.length === 0 ? 0 : duplicatesFound / DUPLICATE_PAIR_FIXTURES.length,
      accuracyAgainstLabels: DUPLICATE_PAIR_FIXTURES.length === 0 ? 0 : correct / DUPLICATE_PAIR_FIXTURES.length,
    };
  }

  private evaluateConflicts() {
    let conflictsFound = 0;
    let correct = 0;
    for (const pair of CONFLICT_PAIR_FIXTURES) {
      const [older, newer] = pair.a.createdAt <= pair.b.createdAt ? [pair.a, pair.b] : [pair.b, pair.a];
      const match = classifyConflict(toDuplicateCandidate(older), toDuplicateCandidate(newer));
      const predicted = match !== null;
      if (predicted) conflictsFound += 1;
      if (predicted === pair.expectedDuplicate) correct += 1;
    }
    return {
      pairsChecked: CONFLICT_PAIR_FIXTURES.length,
      conflictsFound,
      accuracyAgainstLabels: CONFLICT_PAIR_FIXTURES.length === 0 ? 0 : correct / CONFLICT_PAIR_FIXTURES.length,
    };
  }
}

function toDuplicateCandidate(memory: { id: string; type: string; title: string; summary: string; structuredPayload: unknown }) {
  return {
    id: memory.id,
    type: memory.type as never,
    title: memory.title,
    summary: memory.summary,
    structuredPayload: (memory.structuredPayload as Record<string, unknown> | null) ?? null,
  };
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}
