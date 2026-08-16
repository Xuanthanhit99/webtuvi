import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { PremiumStatusDto } from '@beaconvie/types';
import { renderWithQuery } from '@/test/render-with-query';
import { ApiError } from '@/lib/api-error';
import { PremiumUpgradePanel } from './premium-upgrade-panel';
import { premiumApi } from '../api/premium-api';

jest.mock('../api/premium-api', () => ({
  premiumApi: { status: jest.fn(), checkout: jest.fn() },
}));

const FREE_STATUS: PremiumStatusDto = {
  isPremium: false,
  status: 'NONE',
  expiresAt: null,
  priceVnd: 79000,
  currency: 'VND',
  isMvpTestPrice: true,
  paymentsEnabled: true,
};
const PREMIUM_STATUS: PremiumStatusDto = {
  isPremium: true,
  status: 'ACTIVE',
  expiresAt: '2026-02-09T00:00:00.000Z',
  priceVnd: 79000,
  currency: 'VND',
  isMvpTestPrice: true,
  paymentsEnabled: true,
};

describe('PremiumUpgradePanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // jsdom doesn't implement navigation; checkout success sets this instead of actually navigating.
    delete (window as unknown as { location?: unknown }).location;
    (window as unknown as { location: { href: string } }).location = { href: '' };
  });

  it('Free state: shows the upgrade CTA and the Free vs Premium matrix', async () => {
    (premiumApi.status as jest.Mock).mockResolvedValue(FREE_STATUS);
    renderWithQuery(<PremiumUpgradePanel />);
    expect(await screen.findByRole('button', { name: 'Upgrade to Premium' })).toBeInTheDocument();
    expect(screen.getByText('15 / day')).toBeInTheDocument(); // Premium Single Card allowance from the matrix
  });

  it('Free state: discloses the price and the MVP-test-price caveat before checkout', async () => {
    (premiumApi.status as jest.Mock).mockResolvedValue(FREE_STATUS);
    renderWithQuery(<PremiumUpgradePanel />);
    expect(await screen.findByText(/79.000 VND/)).toBeInTheDocument();
    expect(screen.getByText(/MVP test price/)).toBeInTheDocument();
  });

  it('Premium state: shows the active badge and expiry, no upgrade button', async () => {
    (premiumApi.status as jest.Mock).mockResolvedValue(PREMIUM_STATUS);
    renderWithQuery(<PremiumUpgradePanel />);
    expect(await screen.findByText(/You.{1,2}re Premium/)).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Upgrade to Premium' })).not.toBeInTheDocument();
  });

  it('checkout loading: the button shows a loading state while the mutation is pending', async () => {
    (premiumApi.status as jest.Mock).mockResolvedValue(FREE_STATUS);
    let resolveCheckout!: (value: { id: string; checkoutUrl: string }) => void;
    (premiumApi.checkout as jest.Mock).mockReturnValue(new Promise((resolve) => { resolveCheckout = resolve; }));
    const user = userEvent.setup();
    renderWithQuery(<PremiumUpgradePanel />);

    const button = await screen.findByRole('button', { name: 'Upgrade to Premium' });
    await user.click(button);
    expect(button).toHaveAttribute('aria-busy', 'true');
    resolveCheckout({ id: 'order-1', checkoutUrl: 'https://pay.payos.vn/web/abc' } as never);
    await waitFor(() => expect(window.location.href).toBe('https://pay.payos.vn/web/abc'));
  });

  it('checkout failure: a generic provider error surfaces its message', async () => {
    (premiumApi.status as jest.Mock).mockResolvedValue(FREE_STATUS);
    (premiumApi.checkout as jest.Mock).mockRejectedValue(new ApiError('Could not start checkout. Please try again.', 'PAYMENT_PROVIDER_ERROR', 400));
    const user = userEvent.setup();
    renderWithQuery(<PremiumUpgradePanel />);
    await user.click(await screen.findByRole('button', { name: 'Upgrade to Premium' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not start checkout. Please try again.');
  });

  it('provider unavailable: shows a distinct, non-technical message', async () => {
    (premiumApi.status as jest.Mock).mockResolvedValue(FREE_STATUS);
    (premiumApi.checkout as jest.Mock).mockRejectedValue(new ApiError('irrelevant backend message', 'PAYMENT_PROVIDER_UNAVAILABLE', 400));
    const user = userEvent.setup();
    renderWithQuery(<PremiumUpgradePanel />);
    await user.click(await screen.findByRole('button', { name: 'Upgrade to Premium' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Payment is temporarily unavailable');
  });

  it('payments disabled (kill switch): shows the same non-technical unavailable message', async () => {
    (premiumApi.status as jest.Mock).mockResolvedValue(FREE_STATUS);
    (premiumApi.checkout as jest.Mock).mockRejectedValue(new ApiError('irrelevant backend message', 'PAYMENTS_DISABLED', 400));
    const user = userEvent.setup();
    renderWithQuery(<PremiumUpgradePanel />);
    await user.click(await screen.findByRole('button', { name: 'Upgrade to Premium' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Payment is temporarily unavailable');
  });

  it('kill-switch off (Sprint 12): hides the upgrade button and shows an honest unavailable message, before any checkout attempt', async () => {
    (premiumApi.status as jest.Mock).mockResolvedValue({ ...FREE_STATUS, paymentsEnabled: false });
    renderWithQuery(<PremiumUpgradePanel />);
    expect(await screen.findByText(/temporarily unavailable/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Upgrade to Premium' })).not.toBeInTheDocument();
    expect(premiumApi.checkout).not.toHaveBeenCalled();
  });

  it('kill-switch on (default): the upgrade button is shown', async () => {
    (premiumApi.status as jest.Mock).mockResolvedValue(FREE_STATUS);
    renderWithQuery(<PremiumUpgradePanel />);
    expect(await screen.findByRole('button', { name: 'Upgrade to Premium' })).toBeInTheDocument();
  });

  it('never redirects or claims success before the backend actually returns a checkoutUrl', async () => {
    (premiumApi.status as jest.Mock).mockResolvedValue(FREE_STATUS);
    (premiumApi.checkout as jest.Mock).mockResolvedValue({ id: 'order-1', checkoutUrl: null });
    const user = userEvent.setup();
    renderWithQuery(<PremiumUpgradePanel />);
    await user.click(await screen.findByRole('button', { name: 'Upgrade to Premium' }));
    await waitFor(() => expect(premiumApi.checkout).toHaveBeenCalled());
    expect(window.location.href).toBe('');
  });
});
