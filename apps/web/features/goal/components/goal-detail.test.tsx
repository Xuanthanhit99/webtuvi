import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { GoalSummaryDto } from '@beaconvie/types';
import { renderWithQuery } from '@/test/render-with-query';
import { GoalDetail } from './goal-detail';
import { goalApi } from '../api/goal-api';

jest.mock('../api/goal-api', () => ({
  goalApi: {
    get: jest.fn(),
    history: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
    complete: jest.fn(),
    abandon: jest.fn(),
    archive: jest.fn(),
    remove: jest.fn(),
    restore: jest.fn(),
  },
}));

function makeGoal(overrides: Partial<GoalSummaryDto> = {}): GoalSummaryDto {
  return {
    id: 'goal-1',
    title: 'Learn Spanish',
    description: '',
    category: 'LEARNING',
    type: 'MILESTONE_BASED',
    difficulty: 'MEDIUM',
    status: 'ACTIVE',
    visibility: 'PRIVATE',
    linkedTag: 'spanish',
    targetValue: null,
    targetUnit: null,
    targetDate: null,
    startedAt: '2026-01-01T00:00:00.000Z',
    completedAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    archivedAt: null,
    progress: null,
    milestones: [],
    ...overrides,
  };
}

describe('GoalDetail', () => {
  beforeEach(() => jest.clearAllMocks());

  it('an ACTIVE goal shows Pause/Complete/Abandon/Archive/Delete but not Resume/Restore', async () => {
    (goalApi.get as jest.Mock).mockResolvedValue(makeGoal({ status: 'ACTIVE' }));
    (goalApi.history as jest.Mock).mockResolvedValue([]);
    renderWithQuery(<GoalDetail id="goal-1" onClose={jest.fn()} />);

    await screen.findByText('Learn Spanish');
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Complete' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Archive' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Resume' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Restore' })).not.toBeInTheDocument();
  });

  it('a PAUSED goal shows Resume, not Pause', async () => {
    (goalApi.get as jest.Mock).mockResolvedValue(makeGoal({ status: 'PAUSED' }));
    (goalApi.history as jest.Mock).mockResolvedValue([]);
    renderWithQuery(<GoalDetail id="goal-1" onClose={jest.fn()} />);

    await screen.findByText('Learn Spanish');
    expect(screen.getByRole('button', { name: 'Resume' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Pause' })).not.toBeInTheDocument();
  });

  it('an ARCHIVED goal only shows Restore, no other lifecycle action', async () => {
    (goalApi.get as jest.Mock).mockResolvedValue(makeGoal({ status: 'ARCHIVED' }));
    (goalApi.history as jest.Mock).mockResolvedValue([]);
    renderWithQuery(<GoalDetail id="goal-1" onClose={jest.fn()} />);

    await screen.findByText('Learn Spanish');
    expect(screen.getByRole('button', { name: 'Restore' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Pause' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Complete' })).not.toBeInTheDocument();
  });

  it('clicking Pause calls the API and refetches', async () => {
    (goalApi.get as jest.Mock).mockResolvedValue(makeGoal({ status: 'ACTIVE' }));
    (goalApi.history as jest.Mock).mockResolvedValue([]);
    (goalApi.pause as jest.Mock).mockResolvedValue(makeGoal({ status: 'PAUSED' }));
    const user = userEvent.setup();
    renderWithQuery(<GoalDetail id="goal-1" onClose={jest.fn()} />);

    await screen.findByText('Learn Spanish');
    await user.click(screen.getByRole('button', { name: 'Pause' }));
    await waitFor(() => expect(goalApi.pause).toHaveBeenCalledWith('goal-1'));
  });

  it('renders real lifecycle history entries', async () => {
    (goalApi.get as jest.Mock).mockResolvedValue(makeGoal());
    (goalApi.history as jest.Mock).mockResolvedValue([{ id: 'h1', action: 'CREATED', detail: 'Goal "Learn Spanish" created.', createdAt: '2026-01-01T00:00:00.000Z' }]);
    renderWithQuery(<GoalDetail id="goal-1" onClose={jest.fn()} />);

    await screen.findByText('Learn Spanish');
    expect(await screen.findByText('Goal "Learn Spanish" created.')).toBeInTheDocument();
  });
});
