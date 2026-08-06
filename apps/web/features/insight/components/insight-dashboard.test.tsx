import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithQuery } from '@/test/render-with-query';
import { InsightDashboard } from './insight-dashboard';
import { insightApi } from '../api/insight-api';

const mockReplace = jest.fn();
let mockSearchParamsValue = '';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => new URLSearchParams(mockSearchParamsValue),
}));

jest.mock('../api/insight-api', () => ({
  insightApi: {
    statistics: jest.fn(),
    cards: jest.fn(),
    timeline: jest.fn(),
    card: jest.fn(),
    evidence: jest.fn(),
    pin: jest.fn(),
    unpin: jest.fn(),
    archive: jest.fn(),
  },
}));

const card = {
  id: 'i1',
  category: { value: 'GOAL' as const, label: 'Goal' },
  status: { value: 'READY' as const, label: 'Ready' },
  window: 'WEEK' as const,
  windowStart: '2026-01-01T00:00:00.000Z',
  windowEnd: '2026-01-05T00:00:00.000Z',
  reason: { headline: 'A goal pattern.', whyItMatters: ['Relates to a goal (+15).'], evidenceSummary: 'Backed by 2 reflections.' },
  priorityBadge: { tier: 'HIGH' as const, label: 'High priority', priority: 80 },
  evidenceCount: 2,
  relationshipCount: 1,
  pinned: false,
  createdAt: '2026-01-05T00:00:00.000Z',
  updatedAt: '2026-01-05T00:00:00.000Z',
  resolvedAt: null,
};

describe('InsightDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParamsValue = '';
  });

  it('shows a top-level empty state when the caller has no insights at all', async () => {
    (insightApi.statistics as jest.Mock).mockResolvedValue({ total: 0, byStatus: {}, byCategory: {}, averagePriority: 0, readyCount: 0 });
    renderWithQuery(<InsightDashboard />);
    expect(await screen.findByText('No insights yet')).toBeInTheDocument();
  });

  it('defaults to the Top insights section and lists real cards', async () => {
    (insightApi.statistics as jest.Mock).mockResolvedValue({ total: 1, byStatus: {}, byCategory: {}, averagePriority: 80, readyCount: 1 });
    (insightApi.cards as jest.Mock).mockResolvedValue({ items: [card], total: 1, page: 1, pageSize: 20 });
    renderWithQuery(<InsightDashboard />);
    expect(await screen.findByText('A goal pattern.')).toBeInTheDocument();
    expect(insightApi.cards).toHaveBeenCalledWith(expect.objectContaining({ sort: 'priority' }));
  });

  it('switching to the Timeline section queries the timeline endpoint', async () => {
    (insightApi.statistics as jest.Mock).mockResolvedValue({ total: 1, byStatus: {}, byCategory: {}, averagePriority: 80, readyCount: 1 });
    (insightApi.cards as jest.Mock).mockResolvedValue({ items: [card], total: 1, page: 1, pageSize: 20 });
    (insightApi.timeline as jest.Mock).mockResolvedValue({ range: 'week', from: '', to: '', groupBy: 'category', groups: [] });
    const user = userEvent.setup();
    renderWithQuery(<InsightDashboard />);
    await screen.findByText('A goal pattern.');

    await user.click(screen.getByRole('button', { name: 'Timeline' }));
    await waitFor(() => expect(insightApi.timeline).toHaveBeenCalled());
  });

  it('switching to Pinned/Archived applies the right fixed filter', async () => {
    (insightApi.statistics as jest.Mock).mockResolvedValue({ total: 1, byStatus: {}, byCategory: {}, averagePriority: 80, readyCount: 1 });
    (insightApi.cards as jest.Mock).mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 });
    const user = userEvent.setup();
    renderWithQuery(<InsightDashboard />);
    await screen.findByText('No top insights');

    await user.click(screen.getByRole('button', { name: 'Pinned' }));
    await waitFor(() => expect(insightApi.cards).toHaveBeenCalledWith(expect.objectContaining({ pinned: true })));

    await user.click(screen.getByRole('button', { name: 'Archived' }));
    await waitFor(() => expect(insightApi.cards).toHaveBeenCalledWith(expect.objectContaining({ status: 'ARCHIVED' })));
  });

  it('opening ?item=<id> renders the detail view with the real headline and evidence section', async () => {
    mockSearchParamsValue = 'item=i1';
    (insightApi.statistics as jest.Mock).mockResolvedValue({ total: 1, byStatus: {}, byCategory: {}, averagePriority: 80, readyCount: 1 });
    (insightApi.card as jest.Mock).mockResolvedValue(card);
    (insightApi.evidence as jest.Mock).mockResolvedValue([]);
    renderWithQuery(<InsightDashboard />);
    expect(await screen.findByText('A goal pattern.')).toBeInTheDocument();
    expect(screen.getByText('Relates to a goal (+15).')).toBeInTheDocument();
    expect(insightApi.card).toHaveBeenCalledWith('i1');
  });
});
