import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithQuery } from '@/test/render-with-query';
import { DashboardView } from './dashboard-view';
import { dashboardApi } from '../api/dashboard-api';
import { tarotApi } from '@/features/tarot/api/tarot-api';
import { numerologyApi } from '@/features/numerology/api/numerology-api';
import { natalChartApi } from '@/features/natal-chart/api/natal-chart-api';
import { tuViApi } from '@/features/tu-vi/api/tu-vi-api';
import { useAuth } from '@/providers/auth-provider';
import { trackEvent } from '@/lib/analytics';

jest.mock('../api/dashboard-api', () => ({ dashboardApi: { get: jest.fn() } }));
jest.mock('@/features/tarot/api/tarot-api', () => ({ tarotApi: { listReadings: jest.fn() } }));
jest.mock('@/features/numerology/api/numerology-api', () => ({ numerologyApi: { listReadings: jest.fn() } }));
jest.mock('@/features/natal-chart/api/natal-chart-api', () => ({ natalChartApi: { listCharts: jest.fn() } }));
jest.mock('@/features/tu-vi/api/tu-vi-api', () => ({ tuViApi: { listCharts: jest.fn() } }));
jest.mock('@/providers/auth-provider', () => ({ useAuth: jest.fn() }));
jest.mock('@/lib/analytics', () => ({ trackEvent: jest.fn() }));

const emptyList = { items: [], total: 0, page: 1, pageSize: 1 };

function mockHomeData() {
  (useAuth as jest.Mock).mockReturnValue({ user: { displayName: 'Thành Nguyễn' }, isLoading: false, refetch: jest.fn() });
  (dashboardApi.get as jest.Mock).mockResolvedValue({ discoverySuggestion: null });
  (tarotApi.listReadings as jest.Mock).mockResolvedValue(emptyList);
  (numerologyApi.listReadings as jest.Mock).mockResolvedValue(emptyList);
  (natalChartApi.listCharts as jest.Mock).mockResolvedValue(emptyList);
  (tuViApi.listCharts as jest.Mock).mockResolvedValue(emptyList);
}

describe('Mệnh Vi Home V5.2', () => {
  beforeEach(() => { jest.clearAllMocks(); window.sessionStorage.clear(); mockHomeData(); });

  it('renders the locked Oracle Workspace hierarchy for an authenticated user', async () => {
    renderWithQuery(<DashboardView />);
    expect(await screen.findByRole('heading', { level: 1, name: /Thành, điều gì đang ở trong tâm trí bạn/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Dòng chảy hôm nay' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Tarot' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Tiếp tục hành trình' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Khám phá theo từng hệ' })).not.toBeInTheDocument();
  });

  it('changes the recommended path from the selected intent', async () => {
    const user = userEvent.setup();
    renderWithQuery(<DashboardView />);
    await screen.findByRole('heading', { name: 'Tarot' });
    await user.click(screen.getByRole('button', { name: /Công việc/i }));
    expect(screen.getByRole('button', { name: /Công việc/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('heading', { name: 'Tử Vi' })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /Xem vận trình/i }).some((link) => link.getAttribute('href') === '/discover/tu-vi')).toBe(true);
  });

  it('renders guest Home without fetching private personalized APIs', async () => {
    (useAuth as jest.Mock).mockReturnValue({ user: null, isLoading: false, refetch: jest.fn() });
    renderWithQuery(<DashboardView />);
    expect(await screen.findByRole('heading', { level: 1, name: 'Điều gì đang ở trong tâm trí bạn?' })).toBeInTheDocument();
    expect(screen.getByText('Đăng nhập để mở tín hiệu từ hồ sơ của bạn.')).toBeInTheDocument();
    expect(dashboardApi.get).not.toHaveBeenCalled();
    expect(tarotApi.listReadings).not.toHaveBeenCalled();
    await waitFor(() => expect(trackEvent).toHaveBeenCalledWith('home_viewed', { feature: 'home', source: 'guest' }));
  });

  it('keeps the real current Tử Vi cycle in today flow', async () => {
    (tuViApi.listCharts as jest.Mock).mockResolvedValue({ items: [{ id: 'chart-1', palaces: { menh: 'Tý' }, currentDaiVan: { index: 3, ageStart: 24, ageEnd: 33, role: 'Quan Lộc', position: 'Ngọ' }, currentTieuHan: { tuoi: 27, lunarYear: 2026, palace: 'Mão' }, createdAt: '2026-08-01T00:00:00.000Z' }], total: 1, page: 1, pageSize: 1 });
    renderWithQuery(<DashboardView />);
    expect(await screen.findByText('27 tuổi (Âm lịch 2026) · Cung Mão')).toBeInTheDocument();
  });

  it('keeps the most recent real reading as continuity', async () => {
    (tarotApi.listReadings as jest.Mock).mockResolvedValue({ items: [{ id: 't1', spreadName: 'Một lá', cards: [{ card: { name: 'The Star' } }], createdAt: '2026-08-20T00:00:00.000Z' }], total: 1, page: 1, pageSize: 1 });
    (natalChartApi.listCharts as jest.Mock).mockResolvedValue({ items: [{ id: 'n1', placements: [], createdAt: '2026-08-21T00:00:00.000Z' }], total: 1, page: 1, pageSize: 1 });
    renderWithQuery(<DashboardView />);
    expect(await screen.findByText('Bản đồ sao gần nhất')).toBeInTheDocument();
  });

  it('uses honest empty state when no personal signals exist', async () => {
    renderWithQuery(<DashboardView />);
    expect(await screen.findByText(/Chưa có dữ liệu cá nhân/)).toBeInTheDocument();
    expect(screen.getByText('Chưa có hành trình gần đây.')).toBeInTheDocument();
  });
});

it('renders public V5.2 content while authentication is unresolved without fetching private data', () => {
  jest.clearAllMocks();
  (useAuth as jest.Mock).mockReturnValue({ user: null, isLoading: true });
  renderWithQuery(<DashboardView />);
  expect(screen.getByRole('heading', { level: 1, name: 'Điều gì đang ở trong tâm trí bạn?' })).toBeInTheDocument();
  expect(dashboardApi.get).not.toHaveBeenCalled();
});
