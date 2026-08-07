import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { GoalSummaryDto } from '@beaconvie/types';
import { GoalCard } from './goal-card';

const goal: GoalSummaryDto = {
  id: 'goal-1',
  title: 'Learn Spanish',
  description: 'Duolingo daily.',
  category: 'LEARNING',
  type: 'METRIC_BASED',
  difficulty: 'MEDIUM',
  status: 'ACTIVE',
  visibility: 'PRIVATE',
  linkedTag: 'spanish',
  targetValue: 10,
  targetUnit: 'lessons',
  targetDate: null,
  startedAt: '2026-01-01T00:00:00.000Z',
  completedAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  archivedAt: null,
  progress: {
    completionPercent: 40,
    milestoneCompletionPercent: 0,
    trend: 'IMPROVING',
    factors: { formula: 'METRIC_BASED', evidenceCount: 4, milestonesTotal: 0, milestonesCompleted: 0, targetValue: 10, currentValue: 4 },
    previousCompletionPercent: 20,
    computedAt: '2026-01-05T00:00:00.000Z',
    evidence: [],
  },
  milestones: [],
};

describe('GoalCard', () => {
  it('renders the real category/status labels and the backend’s own completion percentage', () => {
    render(<GoalCard goal={goal} onSelect={jest.fn()} />);
    expect(screen.getByText('Learning')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Learn Spanish')).toBeInTheDocument();
    expect(screen.getByText('40%')).toBeInTheDocument();
  });

  it('clicking the card calls onSelect with its real id', async () => {
    const onSelect = jest.fn();
    const user = userEvent.setup();
    render(<GoalCard goal={goal} onSelect={onSelect} />);
    await user.click(screen.getByText('Learn Spanish'));
    expect(onSelect).toHaveBeenCalledWith('goal-1');
  });

  it('a goal with no progress computed yet shows 0%, never a fabricated number', () => {
    render(<GoalCard goal={{ ...goal, progress: null }} onSelect={jest.fn()} />);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });
});
