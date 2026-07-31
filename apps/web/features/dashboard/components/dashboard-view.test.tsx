import { screen } from '@testing-library/react';
import { renderWithQuery } from '@/test/render-with-query';
import { DashboardView } from './dashboard-view';
import { dashboardApi } from '../api/dashboard-api';

jest.mock('../api/dashboard-api', () => ({
  dashboardApi: { get: jest.fn() },
}));

describe('DashboardView', () => {
  it('shows the "no memories yet" empty state for a brand-new user', async () => {
    (dashboardApi.get as jest.Mock).mockResolvedValue({
      hero: { greeting: 'Good morning, Alex.', subheadline: '', ctaLabel: 'Say hello', ctaHref: '/companion' },
      companionPanel: { previewMessages: [], suggestionChip: null },
      memoryHighlight: null,
      discoverySuggestion: null,
      recentActivity: [],
    });

    renderWithQuery(<DashboardView />);

    expect(await screen.findByText('No memories yet.')).toBeInTheDocument();
    expect(screen.getByText('Memories you choose to save will appear here.')).toBeInTheDocument();
  });

  it('shows an error state with retry when the dashboard fails to load', async () => {
    (dashboardApi.get as jest.Mock).mockRejectedValue(new Error('network down'));

    renderWithQuery(<DashboardView />);

    expect(await screen.findByText(/couldn.t load your dashboard/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});
