import { render, screen } from '@testing-library/react';
import { GoalProgressPanel } from './goal-progress-panel';

const progress = {
  completionPercent: 60,
  milestoneCompletionPercent: 50,
  trend: 'IMPROVING' as const,
  factors: { formula: 'MILESTONE_BASED' as const, evidenceCount: 6, milestonesTotal: 4, milestonesCompleted: 2, targetValue: null, currentValue: null },
  previousCompletionPercent: 40,
  computedAt: '2026-01-05T00:00:00.000Z',
  evidence: [],
};

describe('GoalProgressPanel', () => {
  it('renders the real completion/milestone percentages and trend, never recomputing them', () => {
    render(<GoalProgressPanel progress={progress} />);
    expect(screen.getByText('60%')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('Trend: Improving')).toBeInTheDocument();
    expect(screen.getByText('Previously 40%')).toBeInTheDocument();
  });

  it('renders the factors breakdown so "why this percentage" is explainable', () => {
    render(<GoalProgressPanel progress={progress} />);
    expect(screen.getByText('Evidence gathered: 6')).toBeInTheDocument();
    expect(screen.getByText('Milestones: 2/4')).toBeInTheDocument();
  });

  it('shows a plain explanation instead of a fabricated number when progress has never been computed', () => {
    render(<GoalProgressPanel progress={null} />);
    expect(screen.getByText(/hasn.t been computed yet/i)).toBeInTheDocument();
  });
});
