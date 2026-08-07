import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithQuery } from '@/test/render-with-query';
import { ReviewTimeline } from './review-timeline';
import { reviewApi } from '../api/review-api';

jest.mock('../api/review-api', () => ({
  reviewApi: { list: jest.fn() },
}));

const review = {
  id: 'review-1',
  window: 'WEEK' as const,
  windowStart: '2026-01-05T00:00:00.000Z',
  windowEnd: '2026-01-11T23:59:59.999Z',
  state: 'READY' as const,
  overview: 'This week you wrote 5 journal entries.',
  statistics: {
    journalCount: 5,
    memoryCreatedCount: 0,
    reflectionCount: 0,
    insightCount: 0,
    activityCount: 0,
    journalingStreakDays: 0,
    companionConversationCount: 0,
  },
  sections: [],
  createdAt: '2026-01-05T00:00:00.000Z',
  updatedAt: '2026-01-05T00:00:00.000Z',
  resolvedAt: null,
};

describe('ReviewTimeline', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows an honest empty state when there are no reviews yet', async () => {
    (reviewApi.list as jest.Mock).mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 });
    renderWithQuery(<ReviewTimeline onSelect={jest.fn()} />);
    expect(await screen.findByText('No reviews yet')).toBeInTheDocument();
  });

  it('renders real reviews and selecting one calls onSelect with its real id', async () => {
    (reviewApi.list as jest.Mock).mockResolvedValue({ items: [review], total: 1, page: 1, pageSize: 20 });
    const onSelect = jest.fn();
    const user = userEvent.setup();
    renderWithQuery(<ReviewTimeline onSelect={onSelect} />);
    const item = await screen.findByText(review.overview);
    await user.click(item);
    expect(onSelect).toHaveBeenCalledWith('review-1');
  });

  it('changing the window filter re-queries with the new filter', async () => {
    (reviewApi.list as jest.Mock).mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 });
    const user = userEvent.setup();
    renderWithQuery(<ReviewTimeline onSelect={jest.fn()} />);
    await waitFor(() => expect(reviewApi.list).toHaveBeenCalled());

    await user.selectOptions(screen.getByLabelText('Window'), 'WEEK');
    await waitFor(() => expect(reviewApi.list).toHaveBeenCalledWith(expect.objectContaining({ window: 'WEEK' })));
  });

  it('shows an error state with retry on failure', async () => {
    (reviewApi.list as jest.Mock).mockRejectedValue(new Error('network'));
    renderWithQuery(<ReviewTimeline onSelect={jest.fn()} />);
    await waitFor(() => expect(screen.getByText(/couldn.t load your review timeline/i)).toBeInTheDocument());
  });
});
