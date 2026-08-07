import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithQuery } from '@/test/render-with-query';
import { ReviewContent } from './review-content';
import { reviewApi } from '../api/review-api';

jest.mock('../api/review-api', () => ({
  reviewApi: { archive: jest.fn(), exportMarkdown: jest.fn(), exportJson: jest.fn() },
}));

const review = {
  id: 'review-1',
  window: 'WEEK' as const,
  windowStart: '2026-01-05T00:00:00.000Z',
  windowEnd: '2026-01-11T23:59:59.999Z',
  state: 'READY' as const,
  overview: 'This week you wrote 5 journal entries, saved 2 memories, and had 1 insight prepared from 3 reflections.',
  statistics: {
    journalCount: 5,
    memoryCreatedCount: 2,
    reflectionCount: 3,
    insightCount: 1,
    activityCount: 0,
    journalingStreakDays: 2,
    companionConversationCount: 4,
  },
  sections: [
    {
      type: 'HIGHLIGHTS' as const,
      title: 'Highlights',
      summary: '1 items, average priority 60.',
      evidence: [
        {
          sourceType: 'INSIGHT' as const,
          sourceId: 'i1',
          category: 'TOPIC',
          priority: 60,
          sourceTimestamp: '2026-01-06T00:00:00.000Z',
          contribution: 'Insight: 3 reflections connected by SUPPORTS relationships. (priority 60).',
          href: '/insights?item=i1',
        },
      ],
    },
  ],
  createdAt: '2026-01-05T00:00:00.000Z',
  updatedAt: '2026-01-05T00:00:00.000Z',
  resolvedAt: null,
};

describe('ReviewContent', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders overview, real statistics, and section evidence together', async () => {
    const fetcher = jest.fn().mockResolvedValue(review);
    renderWithQuery(<ReviewContent queryKey={['test']} fetcher={fetcher} />);

    expect(await screen.findByText(review.overview)).toBeInTheDocument();
    expect(screen.getByText('Journal entries')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Highlights')).toBeInTheDocument();
    expect(screen.getByText(review.sections[0]!.evidence[0]!.contribution)).toBeInTheDocument();
  });

  it('Archive calls the API and invokes onArchived on success', async () => {
    const fetcher = jest.fn().mockResolvedValue(review);
    (reviewApi.archive as jest.Mock).mockResolvedValue({ ...review, state: 'ARCHIVED' });
    const onArchived = jest.fn();
    const user = userEvent.setup();
    renderWithQuery(<ReviewContent queryKey={['test']} fetcher={fetcher} onArchived={onArchived} />);

    await screen.findByText(review.overview);
    await user.click(screen.getByRole('button', { name: 'Archive' }));

    await waitFor(() => expect(reviewApi.archive).toHaveBeenCalledWith('review-1'));
    await waitFor(() => expect(onArchived).toHaveBeenCalled());
  });

  it('an already-archived review shows no Archive action', async () => {
    const fetcher = jest.fn().mockResolvedValue({ ...review, state: 'ARCHIVED' });
    renderWithQuery(<ReviewContent queryKey={['test']} fetcher={fetcher} />);
    await screen.findByText(review.overview);
    expect(screen.queryByRole('button', { name: 'Archive' })).not.toBeInTheDocument();
  });

  it('changing a filter re-fetches with the new filter applied', async () => {
    const fetcher = jest.fn().mockResolvedValue(review);
    const user = userEvent.setup();
    renderWithQuery(<ReviewContent queryKey={['test']} fetcher={fetcher} />);
    await screen.findByText(review.overview);

    await user.selectOptions(screen.getByLabelText('Category'), 'TOPIC');
    await waitFor(() => expect(fetcher).toHaveBeenCalledWith(expect.objectContaining({ category: 'TOPIC' })));
  });

  it('shows an error state with retry on failure', async () => {
    const fetcher = jest.fn().mockRejectedValue(new Error('network'));
    renderWithQuery(<ReviewContent queryKey={['test']} fetcher={fetcher} />);
    await waitFor(() => expect(screen.getByText(/couldn.t load that review/i)).toBeInTheDocument());
  });
});
