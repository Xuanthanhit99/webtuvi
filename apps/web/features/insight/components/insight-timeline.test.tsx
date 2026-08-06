import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithQuery } from '@/test/render-with-query';
import { InsightTimeline } from './insight-timeline';
import { insightApi } from '../api/insight-api';

jest.mock('../api/insight-api', () => ({
  insightApi: { timeline: jest.fn() },
}));

const card = {
  id: 'i1',
  category: { value: 'GOAL' as const, label: 'Goal' },
  status: { value: 'READY' as const, label: 'Ready' },
  window: 'WEEK' as const,
  windowStart: '2026-01-01T00:00:00.000Z',
  windowEnd: '2026-01-05T00:00:00.000Z',
  reason: { headline: 'A goal pattern.', whyItMatters: [], evidenceSummary: 'Backed by 2 reflections.' },
  priorityBadge: { tier: 'HIGH' as const, label: 'High priority', priority: 80 },
  evidenceCount: 2,
  relationshipCount: 1,
  pinned: false,
  createdAt: '2026-01-05T00:00:00.000Z',
  updatedAt: '2026-01-05T00:00:00.000Z',
  resolvedAt: null,
  day: '2026-01-05',
};

describe('InsightTimeline', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders grouped sections with real labels and item counts', async () => {
    (insightApi.timeline as jest.Mock).mockResolvedValue({
      range: 'week',
      from: '2026-01-01T00:00:00.000Z',
      to: '2026-01-08T00:00:00.000Z',
      groupBy: 'category',
      groups: [{ key: 'GOAL', label: 'Goal', items: [card] }],
    });
    renderWithQuery(<InsightTimeline onSelect={jest.fn()} />);
    expect(await screen.findByText('Goal (1)')).toBeInTheDocument();
    expect(screen.getByText('A goal pattern.')).toBeInTheDocument();
  });

  it('selecting an item calls onSelect with its real id', async () => {
    (insightApi.timeline as jest.Mock).mockResolvedValue({
      range: 'week',
      from: '2026-01-01T00:00:00.000Z',
      to: '2026-01-08T00:00:00.000Z',
      groupBy: 'category',
      groups: [{ key: 'GOAL', label: 'Goal', items: [card] }],
    });
    const onSelect = jest.fn();
    const user = userEvent.setup();
    renderWithQuery(<InsightTimeline onSelect={onSelect} />);
    await user.click(await screen.findByText('A goal pattern.'));
    expect(onSelect).toHaveBeenCalledWith('i1');
  });

  it('shows an honest empty state when nothing falls in the selected range', async () => {
    (insightApi.timeline as jest.Mock).mockResolvedValue({
      range: 'today',
      from: '2026-01-08T00:00:00.000Z',
      to: '2026-01-08T12:00:00.000Z',
      groupBy: 'category',
      groups: [],
    });
    renderWithQuery(<InsightTimeline onSelect={jest.fn()} />);
    expect(await screen.findByText('Nothing in this range')).toBeInTheDocument();
  });

  it('changing the range re-queries the timeline with the new range', async () => {
    (insightApi.timeline as jest.Mock).mockResolvedValue({
      range: 'week',
      from: '2026-01-01T00:00:00.000Z',
      to: '2026-01-08T00:00:00.000Z',
      groupBy: 'category',
      groups: [],
    });
    const user = userEvent.setup();
    renderWithQuery(<InsightTimeline onSelect={jest.fn()} />);
    await waitFor(() => expect(insightApi.timeline).toHaveBeenCalledWith(expect.objectContaining({ range: 'week' })));

    await user.selectOptions(screen.getByLabelText('Range'), 'today');
    await waitFor(() => expect(insightApi.timeline).toHaveBeenCalledWith(expect.objectContaining({ range: 'today' })));
  });

  it('shows an error state with retry on failure', async () => {
    (insightApi.timeline as jest.Mock).mockRejectedValue(new Error('network'));
    renderWithQuery(<InsightTimeline onSelect={jest.fn()} />);
    await waitFor(() => expect(screen.getByText(/couldn.t load the insight timeline/i)).toBeInTheDocument());
  });
});
