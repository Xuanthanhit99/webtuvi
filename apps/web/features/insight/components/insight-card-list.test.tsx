import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { InsightCardDto, ListInsightCardsResultDto } from '@beaconvie/types';
import { renderWithQuery } from '@/test/render-with-query';
import { InsightCardList } from './insight-card-list';
import { insightApi } from '../api/insight-api';

jest.mock('../api/insight-api', () => ({
  insightApi: {
    cards: jest.fn(),
    pin: jest.fn(),
    unpin: jest.fn(),
  },
}));

function makeCard(id: string): InsightCardDto {
  return {
    id,
    category: { value: 'PATTERN', label: 'Pattern' },
    status: { value: 'READY', label: 'Ready' },
    priorityBadge: { tier: 'HIGH', label: 'High priority' },
    pinned: false,
    reason: { headline: `Headline ${id}`, evidenceSummary: '3 pieces of evidence' },
    windowStart: '2026-01-01T00:00:00.000Z',
    windowEnd: '2026-01-07T00:00:00.000Z',
  } as unknown as InsightCardDto;
}

function page(items: InsightCardDto[], total: number): ListInsightCardsResultDto {
  return { items, total } as unknown as ListInsightCardsResultDto;
}

/**
 * Regression coverage for the queueMicrotask-deferred reset/append effects (previously
 * uncovered — see the lint-remediation audit). `insightApi.cards` intentionally reflects the
 * `page`/filters it was called with, back through card ids, so a test can assert on *which*
 * request's data actually reached the rendered list, not just that a mock resolved.
 */
describe('InsightCardList', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders page-1 items once the query resolves', async () => {
    (insightApi.cards as jest.Mock).mockResolvedValue(page([makeCard('a'), makeCard('b')], 2));
    renderWithQuery(
      <InsightCardList baseFilters={{}} showStatus emptyTitle="Nothing yet" emptyDescription="Check back later." onSelect={jest.fn()} />,
    );

    expect(await screen.findByText('Headline a')).toBeInTheDocument();
    expect(screen.getByText('Headline b')).toBeInTheDocument();
  });

  it('shows the empty state, not a stale skeleton, once a page-1 query resolves with zero items', async () => {
    (insightApi.cards as jest.Mock).mockResolvedValue(page([], 0));
    renderWithQuery(
      <InsightCardList baseFilters={{}} showStatus emptyTitle="Nothing yet" emptyDescription="Check back later." onSelect={jest.fn()} />,
    );

    expect(await screen.findByText('Nothing yet')).toBeInTheDocument();
  });

  it('shows a retryable error state on a query failure', async () => {
    (insightApi.cards as jest.Mock).mockRejectedValue(new Error('network down'));
    renderWithQuery(
      <InsightCardList baseFilters={{}} showStatus emptyTitle="Nothing yet" emptyDescription="Check back later." onSelect={jest.fn()} />,
    );

    expect(await screen.findByText("Couldn't load insights.")).toBeInTheDocument();
  });

  it('"Load more" appends page 2 onto page 1 without dropping or duplicating existing items', async () => {
    // total (25) must exceed the component's fixed PAGE_SIZE (20) or "Load more" never renders.
    (insightApi.cards as jest.Mock).mockImplementation(({ page: p }: { page: number }) =>
      Promise.resolve(p === 1 ? page([makeCard('a'), makeCard('b')], 25) : page([makeCard('c'), makeCard('d')], 25)),
    );
    const user = userEvent.setup();
    renderWithQuery(
      <InsightCardList baseFilters={{}} showStatus emptyTitle="Nothing yet" emptyDescription="Check back later." onSelect={jest.fn()} />,
    );

    expect(await screen.findByText('Headline a')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /load more/i }));

    await waitFor(() => expect(screen.getByText('Headline c')).toBeInTheDocument());
    // Page 1's items must still be present — "Load more" appends, it never replaces.
    expect(screen.getByText('Headline a')).toBeInTheDocument();
    expect(screen.getByText('Headline b')).toBeInTheDocument();
    expect(screen.getByText('Headline d')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(4);
  });

  it('changing a filter resets the list to the new page 1, discarding items accumulated from "Load more"', async () => {
    (insightApi.cards as jest.Mock).mockImplementation(({ page: p, category }: { page: number; category?: string }) => {
      if (category === 'TOPIC') return Promise.resolve(page([makeCard('topic-only')], 1));
      return Promise.resolve(p === 1 ? page([makeCard('a'), makeCard('b')], 25) : page([makeCard('c'), makeCard('d')], 25));
    });
    const user = userEvent.setup();
    renderWithQuery(
      <InsightCardList baseFilters={{}} showStatus emptyTitle="Nothing yet" emptyDescription="Check back later." onSelect={jest.fn()} />,
    );

    expect(await screen.findByText('Headline a')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /load more/i }));
    await waitFor(() => expect(screen.getByText('Headline c')).toBeInTheDocument());
    expect(screen.getAllByRole('listitem')).toHaveLength(4);

    await user.selectOptions(screen.getByLabelText('Category'), 'TOPIC');

    await waitFor(() => expect(screen.getByText('Headline topic-only')).toBeInTheDocument());
    // The previously loaded pages (a, b, c, d) must be gone — never left over alongside the
    // freshly filtered page 1, and never shown while the new page 1 is still in flight.
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    expect(screen.queryByText('Headline a')).not.toBeInTheDocument();
    expect(screen.queryByText('Headline c')).not.toBeInTheDocument();
  });

  it('toggling a pin does not reset pagination or duplicate the current page', async () => {
    (insightApi.cards as jest.Mock).mockResolvedValue(page([makeCard('a'), makeCard('b')], 2));
    (insightApi.pin as jest.Mock).mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderWithQuery(
      <InsightCardList baseFilters={{}} showStatus emptyTitle="Nothing yet" emptyDescription="Check back later." onSelect={jest.fn()} />,
    );

    expect(await screen.findByText('Headline a')).toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: /pin insight/i })[0]!);

    await waitFor(() => expect(insightApi.pin).toHaveBeenCalledWith('a'));
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });
});
