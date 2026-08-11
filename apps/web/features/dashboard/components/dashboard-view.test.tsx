import { screen } from '@testing-library/react';
import { renderWithQuery } from '@/test/render-with-query';
import { DashboardView } from './dashboard-view';
import { dashboardApi } from '../api/dashboard-api';
import { premiumApi } from '@/features/premium/api/premium-api';

jest.mock('../api/dashboard-api', () => ({
  dashboardApi: { get: jest.fn() },
}));

jest.mock('@/features/premium/api/premium-api', () => ({
  premiumApi: { status: jest.fn(), checkout: jest.fn() },
}));

const FREE_STATUS = { isPremium: false, status: 'NONE', expiresAt: null, priceVnd: 79000, currency: 'VND', isMvpTestPrice: true };

describe('DashboardView', () => {
  beforeEach(() => {
    (premiumApi.status as jest.Mock).mockResolvedValue(FREE_STATUS);
  });

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

  it('renders the discovery suggestion, memory highlight, and Companion panel as real links', async () => {
    (dashboardApi.get as jest.Mock).mockResolvedValue({
      hero: { greeting: 'Good morning, Alex.', subheadline: '', ctaLabel: 'Say hello', ctaHref: '/companion' },
      companionPanel: { previewMessages: [], suggestionChip: null },
      memoryHighlight: { content: 'Remembered: a new job.', createdAt: new Date().toISOString() },
      discoverySuggestion: { title: 'Discovery', description: 'A real Tarot draw.', href: '/discover', comingSoon: false },
      recentActivity: [],
    });

    renderWithQuery(<DashboardView />);

    expect(await screen.findByText('Discovery')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Discovery/ })).toHaveAttribute('href', '/discover');
    expect(screen.getByRole('link', { name: /a new job/ })).toHaveAttribute('href', '/memory');
    expect(screen.getByRole('link', { name: 'Start a conversation' })).toHaveAttribute('href', '/companion');
  });

  it('shows an error state with retry when the dashboard fails to load', async () => {
    (dashboardApi.get as jest.Mock).mockRejectedValue(new Error('network down'));

    renderWithQuery(<DashboardView />);

    expect(await screen.findByText(/couldn.t load your dashboard/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});
