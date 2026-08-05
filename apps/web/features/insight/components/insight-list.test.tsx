import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithQuery } from '@/test/render-with-query';
import { InsightList } from './insight-list';
import { insightApi } from '../api/insight-api';

jest.mock('../api/insight-api', () => ({
  insightApi: { list: jest.fn() },
}));

const candidate = {
  id: 'i1',
  category: 'GOAL' as const,
  status: 'READY' as const,
  window: 'WEEK' as const,
  windowStart: '2026-01-01T00:00:00.000Z',
  windowEnd: '2026-01-05T00:00:00.000Z',
  ruleExplanation: '2 reflections connected by SUPPORTS relationships.',
  priority: 60,
  priorityExplanation: ['Backed by multiple related reflections (+6).'],
  evidence: [
    { reflectionCandidateId: 'r1', contribution: 'x', reflectionCategory: 'GOAL' as const, reflectionTrigger: 'REPEATED_GOAL' as const, reflectionScore: 40, reflectionState: 'READY' as const },
    { reflectionCandidateId: 'r2', contribution: 'y', reflectionCategory: 'GOAL' as const, reflectionTrigger: 'GOAL_REGRESSION' as const, reflectionScore: 44, reflectionState: 'READY' as const },
  ],
  relationships: [{ id: 'rel1', reflectionAId: 'r1', reflectionBId: 'r2', type: 'SUPPORTS' as const, reason: 'Both relate to goal.' }],
  createdAt: '2026-01-05T00:00:00.000Z',
  updatedAt: '2026-01-05T00:00:00.000Z',
  resolvedAt: null,
};

describe('InsightList', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows an honest empty state when there are no candidates', async () => {
    (insightApi.list as jest.Mock).mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 });
    renderWithQuery(<InsightList onSelect={jest.fn()} />);
    expect(await screen.findByText('No insight candidates yet')).toBeInTheDocument();
  });

  it('renders the real rule explanation, priority, and evidence/relationship counts', async () => {
    (insightApi.list as jest.Mock).mockResolvedValue({ items: [candidate], total: 1, page: 1, pageSize: 20 });
    renderWithQuery(<InsightList onSelect={jest.fn()} />);
    expect(await screen.findByText('2 reflections connected by SUPPORTS relationships.')).toBeInTheDocument();
    expect(screen.getByText('Priority 60')).toBeInTheDocument();
    expect(screen.getByText(/2 evidence/)).toBeInTheDocument();
  });

  it('selecting a candidate calls onSelect with its real id', async () => {
    (insightApi.list as jest.Mock).mockResolvedValue({ items: [candidate], total: 1, page: 1, pageSize: 20 });
    const onSelect = jest.fn();
    const user = userEvent.setup();
    renderWithQuery(<InsightList onSelect={onSelect} />);
    const text = await screen.findByText('2 reflections connected by SUPPORTS relationships.');
    await user.click(text);
    expect(onSelect).toHaveBeenCalledWith('i1');
  });

  it('shows an error state with retry when the list fails to load', async () => {
    (insightApi.list as jest.Mock).mockRejectedValue(new Error('network'));
    renderWithQuery(<InsightList onSelect={jest.fn()} />);
    await waitFor(() => expect(screen.getByText(/couldn.t load insight candidates/i)).toBeInTheDocument());
  });
});
