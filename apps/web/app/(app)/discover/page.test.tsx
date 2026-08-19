import { render, screen } from '@testing-library/react';
import DiscoverPage from './page';

jest.mock('@/components/analytics/analytics-page-view', () => ({ AnalyticsPageView: () => null }));

describe('DiscoverPage — heading hierarchy', () => {
  it('exposes each Discovery system and the Personal Destiny Report as real h2 headings under the page h1', () => {
    render(<DiscoverPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'Discover' })).toBeInTheDocument();

    // Regression: these were previously plain <p> tags, unreachable via heading-navigation.
    expect(screen.getByRole('heading', { level: 2, name: 'Tarot' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Bản Đồ Sao' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Ngũ Hành Phương Đông' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Thần Số Học' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Personal Destiny Report' })).toBeInTheDocument();
  });
});
