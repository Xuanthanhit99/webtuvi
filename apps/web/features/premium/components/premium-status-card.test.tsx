import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithQuery } from '@/test/render-with-query';
import { premiumApi } from '../api/premium-api';
import { PremiumStatusCard } from './premium-status-card';

jest.mock('../api/premium-api', () => ({ premiumApi: { status: jest.fn() } }));
beforeEach(() => jest.resetAllMocks());

it('shows Free only for a successful inactive status response', async () => {
  (premiumApi.status as jest.Mock).mockResolvedValue({ isPremium: false, status: 'NONE' });
  renderWithQuery(<PremiumStatusCard />);
  expect(await screen.findByText('Miễn phí')).toBeInTheDocument();
});
it('shows active Premium from a successful active status response', async () => {
  (premiumApi.status as jest.Mock).mockResolvedValue({ isPremium: true, status: 'ACTIVE' });
  renderWithQuery(<PremiumStatusCard />);
  expect(await screen.findByText('Đang hoạt động')).toBeInTheDocument();
  expect(screen.queryByText('Miễn phí')).not.toBeInTheDocument();
});
it('keeps loading distinct from Free', () => {
  (premiumApi.status as jest.Mock).mockReturnValue(new Promise(() => {}));
  renderWithQuery(<PremiumStatusCard />);
  expect(screen.getByRole('status', { name: 'Đang tải trạng thái Premium' })).toBeInTheDocument();
  expect(screen.queryByText('Miễn phí')).not.toBeInTheDocument();
});
it('shows an unavailable state on error and allows a real status retry', async () => {
  (premiumApi.status as jest.Mock).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({ isPremium: true });
  renderWithQuery(<PremiumStatusCard />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Chưa thể tải trạng thái Premium.');
  expect(screen.queryByText('Miễn phí')).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
  expect(await screen.findByText('Đang hoạt động')).toBeInTheDocument();
});
