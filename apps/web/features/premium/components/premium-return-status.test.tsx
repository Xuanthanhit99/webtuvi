import { screen, waitFor, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PaymentOrderDto } from '@beaconvie/types';
import { renderWithQuery } from '@/test/render-with-query';
import { PremiumReturnStatus } from './premium-return-status';
import { premiumApi } from '../api/premium-api';

let mockSearchParamsValue = 'order=order-1';

jest.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(mockSearchParamsValue),
}));

jest.mock('../api/premium-api', () => ({
  premiumApi: { getOrder: jest.fn(), status: jest.fn() },
}));

function order(overrides: Partial<PaymentOrderDto> = {}): PaymentOrderDto {
  return {
    id: 'order-1',
    status: 'PENDING',
    product: 'PREMIUM_30D',
    amount: 79000,
    currency: 'VND',
    checkoutUrl: 'https://pay.payos.vn/web/abc',
    createdAt: '2026-01-05T00:00:00.000Z',
    paidAt: null,
    ...overrides,
  };
}

describe('PremiumReturnStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParamsValue = 'order=order-1';
    (premiumApi.status as jest.Mock).mockResolvedValue({ isPremium: true, status: 'ACTIVE' });
  });

  it('missing order id: shows a clear message and never calls the backend', async () => {
    mockSearchParamsValue = '';
    renderWithQuery(<PremiumReturnStatus />);
    expect(await screen.findByText('Thiếu mã đơn hàng')).toBeInTheDocument();
    expect(premiumApi.getOrder).not.toHaveBeenCalled();
  });

  it('PENDING: shows a confirming state, never claims success from the return URL alone', async () => {
    (premiumApi.getOrder as jest.Mock).mockResolvedValue(order({ status: 'PENDING' }));
    renderWithQuery(<PremiumReturnStatus />);
    expect(await screen.findByText('Đang xác nhận thanh toán…')).toBeInTheDocument();
    expect(screen.queryByText('Premium đã được kích hoạt')).not.toBeInTheDocument();
  });

  it('PAID + active entitlement: confirms current access from the status endpoint', async () => {
    (premiumApi.getOrder as jest.Mock).mockResolvedValue(order({ status: 'PAID', paidAt: '2026-01-05T00:05:00.000Z' }));
    renderWithQuery(<PremiumReturnStatus />);
    expect(await screen.findByText('Premium đã được kích hoạt')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Tiếp tục với Tarot' })).toHaveAttribute('href', '/discover/tarot');
    expect(premiumApi.status).toHaveBeenCalled();
  });

  it.each(['NONE', 'EXPIRED', 'REVOKED'])('PAID + %s entitlement does not claim active access', async (status) => {
    (premiumApi.getOrder as jest.Mock).mockResolvedValue(order({ status: 'PAID' }));
    (premiumApi.status as jest.Mock).mockResolvedValue({ isPremium: false, status });
    renderWithQuery(<PremiumReturnStatus />);
    expect(await screen.findByText('Premium hiện chưa hoạt động')).toBeInTheDocument();
    expect(screen.queryByText('Premium đã được kích hoạt')).not.toBeInTheDocument();
  });

  it('PAID + failed status lookup shows unknown access, and retry can confirm access', async () => {
    (premiumApi.getOrder as jest.Mock).mockResolvedValue(order({ status: 'PAID' }));
    (premiumApi.status as jest.Mock).mockRejectedValueOnce(new Error('offline'));
    renderWithQuery(<PremiumReturnStatus />);
    expect(await screen.findByText('Chưa thể kiểm tra quyền lợi Premium')).toBeInTheDocument();
    expect(screen.queryByText('Premium đã được kích hoạt')).not.toBeInTheDocument();
    expect(screen.queryByText(/Free plan|Gói miễn phí/)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Kiểm tra lại' }));
    expect(await screen.findByText('Premium đã được kích hoạt')).toBeInTheDocument();
  });

  it('does not confirm a cached active entitlement before a fresh lookup completes', async () => {
    (premiumApi.getOrder as jest.Mock).mockResolvedValue(order({ status: 'PAID' }));
    (premiumApi.status as jest.Mock).mockReturnValue(new Promise(() => {}));
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    client.setQueryData(['premium', 'status'], { isPremium: true, status: 'ACTIVE' });
    render(<QueryClientProvider client={client}><PremiumReturnStatus /></QueryClientProvider>);
    expect(await screen.findByText('Đang xác nhận quyền lợi Premium…')).toBeInTheDocument();
    expect(premiumApi.status).toHaveBeenCalled();
    expect(screen.queryByText('Premium đã được kích hoạt')).not.toBeInTheDocument();
  });

  it('FAILED: shows a non-alarming retry state, not a generic crash', async () => {
    (premiumApi.getOrder as jest.Mock).mockResolvedValue(order({ status: 'FAILED' }));
    renderWithQuery(<PremiumReturnStatus />);
    expect(await screen.findByText('Thanh toán chưa thành công')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Thử lại' })).toHaveAttribute('href', '/premium');
  });

  it('lookup error: reassures rather than implying the payment failed', async () => {
    (premiumApi.getOrder as jest.Mock).mockRejectedValue(new Error('network error'));
    renderWithQuery(<PremiumReturnStatus />);
    expect(await screen.findByText('Chưa thể kiểm tra thanh toán')).toBeInTheDocument();
  });

  it('polls a PENDING order (refetchInterval) until it resolves to PAID', async () => {
    (premiumApi.getOrder as jest.Mock).mockResolvedValueOnce(order({ status: 'PENDING' })).mockResolvedValueOnce(order({ status: 'PAID' }));
    renderWithQuery(<PremiumReturnStatus />);
    await screen.findByText('Đang xác nhận thanh toán…');
    await waitFor(() => expect(premiumApi.getOrder).toHaveBeenCalledTimes(2), { timeout: 5000 });
    expect(await screen.findByText('Premium đã được kích hoạt')).toBeInTheDocument();
  });
});
