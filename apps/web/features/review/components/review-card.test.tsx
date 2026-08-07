import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReviewSummaryDto } from '@beaconvie/types';
import { ReviewCard } from './review-card';

const review: ReviewSummaryDto = {
  id: 'review-1',
  window: 'WEEK',
  windowStart: '2026-01-05T00:00:00.000Z',
  windowEnd: '2026-01-11T23:59:59.999Z',
  state: 'READY',
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
  sections: [],
  createdAt: '2026-01-05T00:00:00.000Z',
  updatedAt: '2026-01-05T00:00:00.000Z',
  resolvedAt: null,
};

describe('ReviewCard', () => {
  it('renders the real window/status labels and the backend’s own overview sentence', () => {
    render(<ReviewCard review={review} onSelect={jest.fn()} />);
    expect(screen.getByText('Weekly')).toBeInTheDocument();
    expect(screen.getByText('Ready')).toBeInTheDocument();
    expect(screen.getByText(review.overview)).toBeInTheDocument();
  });

  it('clicking the card calls onSelect with its real id', async () => {
    const onSelect = jest.fn();
    const user = userEvent.setup();
    render(<ReviewCard review={review} onSelect={onSelect} />);
    await user.click(screen.getByText(review.overview));
    expect(onSelect).toHaveBeenCalledWith('review-1');
  });

  it('an archived review shows the Archived status label', () => {
    render(<ReviewCard review={{ ...review, state: 'ARCHIVED' }} onSelect={jest.fn()} />);
    expect(screen.getByText('Archived')).toBeInTheDocument();
  });
});
