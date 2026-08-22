import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithQuery } from '@/test/render-with-query';
import { DashboardView, DestinyCompass, EnergyGauge } from './dashboard-view';
import { dashboardApi } from '../api/dashboard-api';
import { tarotApi } from '@/features/tarot/api/tarot-api';
import { numerologyApi } from '@/features/numerology/api/numerology-api';
import { natalChartApi } from '@/features/natal-chart/api/natal-chart-api';
import { tuViApi } from '@/features/tu-vi/api/tu-vi-api';
import { premiumApi } from '@/features/premium/api/premium-api';
import { useAuth } from '@/providers/auth-provider';
import { trackEvent } from '@/lib/analytics';

jest.mock('../api/dashboard-api', () => ({
  dashboardApi: { get: jest.fn() },
}));

jest.mock('@/features/tarot/api/tarot-api', () => ({
  tarotApi: { listReadings: jest.fn() },
}));

jest.mock('@/features/numerology/api/numerology-api', () => ({
  numerologyApi: { listReadings: jest.fn() },
}));

jest.mock('@/features/natal-chart/api/natal-chart-api', () => ({
  natalChartApi: { listCharts: jest.fn() },
}));

jest.mock('@/features/tu-vi/api/tu-vi-api', () => ({
  tuViApi: { listCharts: jest.fn() },
}));

jest.mock('@/features/premium/api/premium-api', () => ({
  premiumApi: { status: jest.fn(), checkout: jest.fn() },
}));

jest.mock('@/providers/auth-provider', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/lib/analytics', () => ({
  trackEvent: jest.fn(),
}));

const emptyList = { items: [], total: 0, page: 1, pageSize: 1 };
const freeStatus = {
  isPremium: false,
  status: 'NONE',
  expiresAt: null,
  priceVnd: 79000,
  currency: 'VND',
  isMvpTestPrice: true,
  paymentsEnabled: true,
};

function mockHomeData() {
  (useAuth as jest.Mock).mockReturnValue({ user: { displayName: 'Thành Nguyễn' }, isLoading: false, refetch: jest.fn() });
  (dashboardApi.get as jest.Mock).mockResolvedValue({
    hero: { greeting: 'Good afternoon, Thành.', subheadline: '', ctaLabel: 'Say hello', ctaHref: '/companion' },
    companionPanel: { previewMessages: [], suggestionChip: null },
    memoryHighlight: null,
    discoverySuggestion: null,
    recentActivity: [],
  });
  (tarotApi.listReadings as jest.Mock).mockResolvedValue(emptyList);
  (numerologyApi.listReadings as jest.Mock).mockResolvedValue(emptyList);
  (natalChartApi.listCharts as jest.Mock).mockResolvedValue(emptyList);
  (tuViApi.listCharts as jest.Mock).mockResolvedValue(emptyList);
  (premiumApi.status as jest.Mock).mockResolvedValue(freeStatus);
}

describe('Tử Vi Tarot Home page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.sessionStorage.clear();
    mockHomeData();
  });

  it('uses the authenticated user name without hard-coding a production name', async () => {
    renderWithQuery(<DashboardView />);

    expect(await screen.findByRole('heading', { name: 'Thành' })).toBeInTheDocument();
    expect(await screen.findByText('Vận trình hôm nay chưa được tạo.')).toBeInTheDocument();
  });

  it('renders honest empty states for missing discovery data', async () => {
    renderWithQuery(<DashboardView />);

    expect(await screen.findByText('Khám phá bản đồ vận mệnh của bạn.')).toBeInTheDocument();
    expect(screen.getByText('Một lá bài cho câu hỏi của bạn.')).toBeInTheDocument();
    expect(screen.getByText('Cần ngày, giờ và nơi sinh để hoàn thiện bản đồ sao.')).toBeInTheDocument();
    expect(screen.getByText('Tính các con số cốt lõi từ tên và ngày sinh.')).toBeInTheDocument();
  });

  it('shows a module-level daily insight error without crashing Home', async () => {
    (dashboardApi.get as jest.Mock).mockRejectedValue(new Error('network down'));

    renderWithQuery(<DashboardView />);

    expect(await screen.findByText('Không thể tải vận trình hôm nay.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Thử lại' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Lá số Tử Vi/ })).toBeInTheDocument();
  });

  it('renders guest Home without calling private personalized APIs', async () => {
    (useAuth as jest.Mock).mockReturnValue({ user: null, isLoading: false, refetch: jest.fn() });

    renderWithQuery(<DashboardView />);

    expect(screen.getByRole('heading', { level: 1, name: /Hiểu mình/i })).toBeInTheDocument();
    expect(screen.getByText(/Không cần đăng ký để bắt đầu khám phá/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Tarot Một lá bài cho câu hỏi hôm nay/i })).toHaveAttribute('href', '#try-tarot');
    expect(dashboardApi.get).not.toHaveBeenCalled();
    expect(tarotApi.listReadings).not.toHaveBeenCalled();
    expect(premiumApi.status).not.toHaveBeenCalled();
    await waitFor(() => expect(trackEvent).toHaveBeenCalledWith('home_viewed', { feature: 'home', source: 'guest' }));
  });

  it('shows guest value boundaries for Tarot, Numerology, and Tử Vi', () => {
    (useAuth as jest.Mock).mockReturnValue({ user: null, isLoading: false, refetch: jest.fn() });

    renderWithQuery(<DashboardView />);

    expect(screen.getByRole('button', { name: 'Rút một lá' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tính thử' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Lập lá số đầy đủ' })).toBeInTheDocument();
    expect(screen.getByText(/không lưu lịch sử và không gọi AI/i)).toBeInTheDocument();
  });

  it('preserves a guest Tarot preview locally and continues auth to the Tarot step', async () => {
    (useAuth as jest.Mock).mockReturnValue({ user: null, isLoading: false, refetch: jest.fn() });
    const user = userEvent.setup();

    renderWithQuery(<DashboardView />);

    await user.click(screen.getByRole('button', { name: 'Rút một lá' }));
    expect(screen.getByRole('button', { name: 'Đang rút...' })).toBeDisabled();
    expect(await within(document.querySelector('#try-tarot')!).findByText(/The Star|The Magician|Temperance/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Rút lá khác' })).toBeInTheDocument();
    expect(window.sessionStorage.getItem('mv_guest_tarot_preview')).toContain('"type":"tarot"');
    expect(trackEvent).toHaveBeenCalledWith('guest_tarot_started', { feature: 'tarot', spreadType: 'single_card' });
    expect(trackEvent).toHaveBeenCalledWith('guest_tarot_preview_completed', { feature: 'tarot', spreadType: 'single_card' });

    await user.click(screen.getByRole('button', { name: 'Xem luận giải đầy đủ' }));
    expect(screen.getByRole('link', { name: 'Đăng ký miễn phí' })).toHaveAttribute('href', '/register?next=%2Fdiscover%2Ftarot');
    expect(screen.getByRole('link', { name: 'Đã có tài khoản? Đăng nhập' })).toHaveAttribute('href', '/login?next=%2Fdiscover%2Ftarot');
  });

  it('shows guest numerology validation without storing invalid DOB values', async () => {
    (useAuth as jest.Mock).mockReturnValue({ user: null, isLoading: false, refetch: jest.fn() });
    const user = userEvent.setup();

    renderWithQuery(<DashboardView />);

    await user.click(screen.getByRole('button', { name: 'Tính thử' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Vui lòng chọn ngày sinh.');
    expect(window.sessionStorage.getItem('mv_guest_numerology_preview')).toBeNull();

    await user.type(screen.getByLabelText('Ngày sinh'), '2999-01-01');
    await user.click(screen.getByRole('button', { name: 'Tính thử' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Ngày sinh không thể ở tương lai.');
    expect(window.sessionStorage.getItem('mv_guest_numerology_preview')).toBeNull();
  });

  it('uses the canonical Life Path preview, stores DOB only in sessionStorage, and continues auth to Numerology', async () => {
    (useAuth as jest.Mock).mockReturnValue({ user: null, isLoading: false, refetch: jest.fn() });
    const user = userEvent.setup();

    renderWithQuery(<DashboardView />);

    await user.type(screen.getByLabelText('Ngày sinh'), '1995-08-17');
    await user.click(screen.getByRole('button', { name: 'Tính thử' }));

    expect(screen.getByText('22')).toBeInTheDocument();
    expect(window.sessionStorage.getItem('mv_guest_numerology_preview')).toContain('"birthDate":"1995-08-17"');
    expect(trackEvent).toHaveBeenCalledWith('guest_numerology_started', { feature: 'numerology' });
    expect(trackEvent).toHaveBeenCalledWith('guest_numerology_preview_completed', { feature: 'numerology' });

    await user.click(screen.getByRole('button', { name: 'Xem hồ sơ đầy đủ' }));
    expect(screen.getByRole('link', { name: 'Đăng ký miễn phí' })).toHaveAttribute('href', '/register?next=%2Fdiscover%2Fnumerology');
    expect(screen.getByRole('link', { name: 'Đã có tài khoản? Đăng nhập' })).toHaveAttribute(
      'href',
      '/login?next=%2Fdiscover%2Fnumerology',
    );
  });

  it('maps authenticated Home CTAs to real routes and fires specific analytics', async () => {
    renderWithQuery(<DashboardView />);
    const user = userEvent.setup();

    await screen.findByText('Cần ngày, giờ và nơi sinh để hoàn thiện bản đồ sao.');
    const tuVi = screen.getAllByRole('link', { name: /Lá số Tử Vi/i }).find((link) => link.getAttribute('href') === '/discover/tu-vi')!;
    const tarot = screen.getAllByRole('link', { name: /Tarot/i }).find((link) => link.getAttribute('href') === '/discover/tarot')!;
    const natal = screen.getAllByRole('link', { name: /Bản đồ sao/i }).find((link) => link.getAttribute('href') === '/discover/natal-chart')!;
    const numerology = screen.getAllByRole('link', { name: /Thần số học/i }).find((link) => link.getAttribute('href') === '/discover/numerology')!;

    expect(tuVi).toHaveAttribute('href', '/discover/tu-vi');
    expect(tarot).toHaveAttribute('href', '/discover/tarot');
    expect(natal).toHaveAttribute('href', '/discover/natal-chart');
    expect(numerology).toHaveAttribute('href', '/discover/numerology');

    [tuVi, tarot, natal, numerology].forEach((link) => link.addEventListener('click', (event) => event.preventDefault()));
    await user.click(tuVi);
    await user.click(tarot);
    await user.click(natal);
    await user.click(numerology);

    expect(trackEvent).toHaveBeenCalledWith('home_tuvi_clicked', { feature: 'tu_vi', source: 'home' });
    expect(trackEvent).toHaveBeenCalledWith('home_tarot_clicked', { feature: 'tarot', source: 'home' });
    expect(trackEvent).toHaveBeenCalledWith('home_astrology_clicked', { feature: 'natal_chart', source: 'home' });
    expect(trackEvent).toHaveBeenCalledWith('home_numerology_clicked', { feature: 'numerology', source: 'home' });
  });

  it('shows a retryable module error for API-backed feature cards', async () => {
    (tuViApi.listCharts as jest.Mock).mockRejectedValue(new Error('tu vi down'));
    const user = userEvent.setup();

    renderWithQuery(<DashboardView />);

    expect(await screen.findByText('Không thể tải lá số.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(tuViApi.listCharts).toHaveBeenCalledTimes(2);
  });
});

describe('Tử Vi Tarot Home visuals', () => {
  it('renders all 12 Destiny Compass branch labels', () => {
    render(<DestinyCompass />);

    ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'].forEach((branch) => {
      expect(screen.getByText(branch)).toBeInTheDocument();
    });
  });

  it('renders an accessible Energy Gauge score', () => {
    render(<EnergyGauge score={78} />);

    expect(screen.getByLabelText('Năng lượng 78 trên 100')).toBeInTheDocument();
    expect(screen.getByText('78')).toBeInTheDocument();
  });

  it('renders an honest empty Energy Gauge state when no score exists', () => {
    render(<EnergyGauge label="Chưa có điểm năng lượng" />);

    expect(screen.getByLabelText('Chưa có điểm năng lượng')).toBeInTheDocument();
    expect(screen.getByText('--')).toBeInTheDocument();
  });
});
