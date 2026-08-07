import { render, screen } from '@testing-library/react';
import type { ReviewStatisticsDto } from '@beaconvie/types';
import { ReviewStatisticsPanel } from './review-statistics-panel';

const statistics: ReviewStatisticsDto = {
  journalCount: 5,
  memoryCreatedCount: 2,
  reflectionCount: 8,
  insightCount: 3,
  activityCount: 1,
  journalingStreakDays: 4,
  companionConversationCount: 12,
};

describe('ReviewStatisticsPanel', () => {
  it('renders every real statistic, never a derived or fabricated number', () => {
    render(<ReviewStatisticsPanel statistics={statistics} />);
    expect(screen.getByText('Journal entries')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Memories saved')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Reflections')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('Insights')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Activity events')).toBeInTheDocument();
    expect(screen.getByText('Journaling streak (days)')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('Companion conversations')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('renders honest zeros rather than hiding a statistic with no activity', () => {
    render(<ReviewStatisticsPanel statistics={{ ...statistics, activityCount: 0 }} />);
    expect(screen.getByText('Activity events')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });
});
