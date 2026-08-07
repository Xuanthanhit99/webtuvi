import { computeGoalProgress } from './goal-progress.util';
import type { GoalProgressInput } from '../goal.types';

function baseInput(overrides: Partial<GoalProgressInput> = {}): GoalProgressInput {
  return {
    type: 'MILESTONE_BASED',
    status: 'ACTIVE',
    targetValue: null,
    milestones: [],
    evidenceCount: 0,
    previousCompletionPercent: null,
    ...overrides,
  };
}

describe('computeGoalProgress', () => {
  describe('MILESTONE_BASED', () => {
    it('is 0% with no milestones', () => {
      const result = computeGoalProgress(baseInput({ type: 'MILESTONE_BASED' }));
      expect(result.completionPercent).toBe(0);
    });

    it('is completedMilestones / totalMilestones * 100', () => {
      const result = computeGoalProgress(
        baseInput({
          type: 'MILESTONE_BASED',
          milestones: [
            { id: 'm1', type: 'MANUAL', status: 'COMPLETED', targetCount: null },
            { id: 'm2', type: 'MANUAL', status: 'PENDING', targetCount: null },
            { id: 'm3', type: 'MANUAL', status: 'COMPLETED', targetCount: null },
            { id: 'm4', type: 'MANUAL', status: 'PENDING', targetCount: null },
          ],
        }),
      );
      expect(result.completionPercent).toBe(50);
      expect(result.milestoneCompletionPercent).toBe(50);
    });

    it('counts a PENDING AUTOMATIC milestone whose target is reached as completed for this pass', () => {
      const result = computeGoalProgress(
        baseInput({
          type: 'MILESTONE_BASED',
          milestones: [{ id: 'm1', type: 'AUTOMATIC', status: 'PENDING', targetCount: 5 }],
          evidenceCount: 5,
        }),
      );
      expect(result.completionPercent).toBe(100);
      expect(result.milestonesToAutoComplete).toEqual(['m1']);
    });

    it('does not auto-complete an AUTOMATIC milestone below its target', () => {
      const result = computeGoalProgress(
        baseInput({
          type: 'MILESTONE_BASED',
          milestones: [{ id: 'm1', type: 'AUTOMATIC', status: 'PENDING', targetCount: 5 }],
          evidenceCount: 4,
        }),
      );
      expect(result.milestonesToAutoComplete).toEqual([]);
      expect(result.completionPercent).toBe(0);
    });

    it('never resurrects a FAILED or ARCHIVED AUTOMATIC milestone even if the target is later reached', () => {
      const result = computeGoalProgress(
        baseInput({
          type: 'MILESTONE_BASED',
          milestones: [
            { id: 'm1', type: 'AUTOMATIC', status: 'FAILED', targetCount: 5 },
            { id: 'm2', type: 'AUTOMATIC', status: 'ARCHIVED', targetCount: 5 },
          ],
          evidenceCount: 10,
        }),
      );
      expect(result.milestonesToAutoComplete).toEqual([]);
    });
  });

  describe('METRIC_BASED', () => {
    it('is clamp(currentValue / targetValue * 100, 0, 100)', () => {
      const result = computeGoalProgress(baseInput({ type: 'METRIC_BASED', targetValue: 10, evidenceCount: 4 }));
      expect(result.completionPercent).toBe(40);
      expect(result.factors.currentValue).toBe(4);
    });

    it('clamps at 100 when evidence exceeds the target', () => {
      const result = computeGoalProgress(baseInput({ type: 'METRIC_BASED', targetValue: 10, evidenceCount: 25 }));
      expect(result.completionPercent).toBe(100);
    });

    it('is 0 with no target value set', () => {
      const result = computeGoalProgress(baseInput({ type: 'METRIC_BASED', targetValue: null, evidenceCount: 5 }));
      expect(result.completionPercent).toBe(0);
    });
  });

  describe('BINARY', () => {
    it('is 0 unless status is explicitly COMPLETED — never partial credit from evidence/milestones', () => {
      const result = computeGoalProgress(baseInput({ type: 'BINARY', status: 'ACTIVE', evidenceCount: 1000 }));
      expect(result.completionPercent).toBe(0);
    });

    it('is 100 once status is COMPLETED', () => {
      const result = computeGoalProgress(baseInput({ type: 'BINARY', status: 'COMPLETED' }));
      expect(result.completionPercent).toBe(100);
    });
  });

  describe('trend', () => {
    it('is NEW with no prior computation', () => {
      const result = computeGoalProgress(baseInput({ type: 'BINARY', status: 'COMPLETED', previousCompletionPercent: null }));
      expect(result.trend).toBe('NEW');
    });

    it('is IMPROVING when completion increased', () => {
      const result = computeGoalProgress(baseInput({ type: 'METRIC_BASED', targetValue: 10, evidenceCount: 5, previousCompletionPercent: 30 }));
      expect(result.trend).toBe('IMPROVING');
    });

    it('is DECLINING when completion decreased', () => {
      const result = computeGoalProgress(baseInput({ type: 'METRIC_BASED', targetValue: 10, evidenceCount: 2, previousCompletionPercent: 50 }));
      expect(result.trend).toBe('DECLINING');
    });

    it('is STABLE when completion is unchanged', () => {
      const result = computeGoalProgress(baseInput({ type: 'METRIC_BASED', targetValue: 10, evidenceCount: 5, previousCompletionPercent: 50 }));
      expect(result.trend).toBe('STABLE');
    });
  });

  it('is deterministic — the same input always produces the same output', () => {
    const input = baseInput({
      type: 'MILESTONE_BASED',
      milestones: [
        { id: 'm1', type: 'MANUAL', status: 'COMPLETED', targetCount: null },
        { id: 'm2', type: 'AUTOMATIC', status: 'PENDING', targetCount: 3 },
      ],
      evidenceCount: 3,
      previousCompletionPercent: 25,
    });
    expect(computeGoalProgress(input)).toEqual(computeGoalProgress(input));
  });
});
