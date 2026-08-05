import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithQuery } from '@/test/render-with-query';
import { InsightDetail } from './insight-detail';
import { insightApi } from '../api/insight-api';

jest.mock('../api/insight-api', () => ({
  insightApi: { get: jest.fn(), archive: jest.fn() },
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
  priorityExplanation: ['Backed by multiple related reflections (+6).', 'Relates to a goal (+15).'],
  evidence: [
    { reflectionCandidateId: 'r1', contribution: 'You mentioned this goal a few times (score 40).', reflectionCategory: 'GOAL' as const, reflectionTrigger: 'REPEATED_GOAL' as const, reflectionScore: 40, reflectionState: 'READY' as const },
  ],
  relationships: [{ id: 'rel1', reflectionAId: 'r1', reflectionBId: 'r2', type: 'SUPPORTS' as const, reason: 'Both relate to goal.' }],
  createdAt: '2026-01-05T00:00:00.000Z',
  updatedAt: '2026-01-05T00:00:00.000Z',
  resolvedAt: null,
};

describe('InsightDetail', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders the rule explanation, priority (never bare), evidence, and relationships', async () => {
    (insightApi.get as jest.Mock).mockResolvedValue(candidate);
    renderWithQuery(<InsightDetail id="i1" onClose={jest.fn()} />);
    expect(await screen.findByText('2 reflections connected by SUPPORTS relationships.')).toBeInTheDocument();
    expect(screen.getByText('60')).toBeInTheDocument();
    expect(screen.getByText('Backed by multiple related reflections (+6).')).toBeInTheDocument();
    expect(screen.getByText('You mentioned this goal a few times (score 40).')).toBeInTheDocument();
    expect(screen.getByText('Both relate to goal.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Archive' })).toBeInTheDocument();
  });

  it('Archive calls the API and closes on success', async () => {
    (insightApi.get as jest.Mock).mockResolvedValue(candidate);
    (insightApi.archive as jest.Mock).mockResolvedValue({ ...candidate, status: 'ARCHIVED' });
    const onClose = jest.fn();
    const user = userEvent.setup();
    renderWithQuery(<InsightDetail id="i1" onClose={onClose} />);
    await screen.findByText('2 reflections connected by SUPPORTS relationships.');

    await user.click(screen.getByRole('button', { name: 'Archive' }));

    await waitFor(() => expect(insightApi.archive).toHaveBeenCalledWith('i1'));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('a resolved (archived) candidate shows no Archive action', async () => {
    (insightApi.get as jest.Mock).mockResolvedValue({ ...candidate, status: 'ARCHIVED' });
    renderWithQuery(<InsightDetail id="i1" onClose={jest.fn()} />);
    await screen.findByText('2 reflections connected by SUPPORTS relationships.');
    expect(screen.queryByRole('button', { name: 'Archive' })).not.toBeInTheDocument();
  });
});
