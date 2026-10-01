import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ListTuViChartsResultDto, TuViChartDto } from '@beaconvie/types';
import { renderWithQuery } from '@/test/render-with-query';
import { TuViDashboard } from './tu-vi-dashboard';
import { tuViApi } from '../api/tu-vi-api';

const mockReplace = jest.fn();
let mockSearchParamsValue = '';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => new URLSearchParams(mockSearchParamsValue),
}));

jest.mock('../api/tu-vi-api', () => ({
  tuViApi: {
    calculate: jest.fn(),
    listCharts: jest.fn(),
    getChart: jest.fn(),
    chartHistory: jest.fn(),
    retryInterpretation: jest.fn(),
    archiveChart: jest.fn(),
    restoreChart: jest.fn(),
    deleteChart: jest.fn(),
  },
}));

jest.mock('@/features/premium/hooks/use-premium-status', () => ({
  usePremiumStatus: () => ({ data: { isPremium: false } }),
}));

// Synthetic fixture — real domain accuracy is covered by the engine's own test suite; this only
// exercises frontend rendering/wiring against an already-real `TuViChartDto` shape.
const chart: TuViChartDto = {
  id: 'c1',
  status: 'ACTIVE',
  birthDate: '1984-02-02',
  birthTime: '00:30',
  sex: 'Nam',
  versions: {
    engineVersion: 'tuvi-engine-v1',
    calendarVersion: 'v1',
    rulesetVersion: 'VDTTL_1956_V1',
    mainStarVersion: 'tuvi-main-stars-v1',
    auxiliaryVersion: 'core-13-v1',
    tuanTrietVersion: 'tuvi-tuan-triet-v1',
    tuHoaVersion: 'tuvi-tu-hoa-v1',
    dignityVersion: 'tuvi-dignity-v1',
    cycleVersion: 'tuvi-cycle-v1',
  },
  lunarDate: { lunarYear: 1984, lunarMonth: 1, lunarDay: 1, isLeapMonth: false },
  hourBranch: 'Tý',
  canChi: { year: { stem: 'Giáp', branch: 'Tý' } },
  palaces: {
    menh: 'Dần',
    than: 'Dần',
    layout: {
      'Dần': 'Mệnh',
      'Mão': 'Phụ Mẫu',
      'Thìn': 'Phúc Đức',
      'Tỵ': 'Điền Trạch',
      'Ngọ': 'Quan Lộc',
      'Mùi': 'Nô Bộc',
      'Thân': 'Thiên Di',
      'Dậu': 'Tật Ách',
      'Tuất': 'Tài Bạch',
      'Hợi': 'Tử Tức',
      'Tý': 'Phu Thê',
      'Sửu': 'Huynh Đệ',
    },
  },
  cuc: 'Hỏa Lục Cục',
  mainStars: [{ star: 'Tử Vi', position: 'Dần', dignity: 'Miếu địa' }],
  auxiliaryStars: [{ star: 'Lộc Tồn', position: 'Dần' }],
  tuan: { first: 'Tuất', second: 'Hợi' },
  triet: { first: 'Thân', second: 'Dậu' },
  transformations: [
    { transformation: 'Hóa Lộc', targetStar: 'Tử Vi', position: 'Dần' },
    { transformation: 'Hóa Quyền', targetStar: 'Tử Vi', position: 'Dần' },
    { transformation: 'Hóa Khoa', targetStar: 'Tử Vi', position: 'Dần' },
    { transformation: 'Hóa Kỵ', targetStar: 'Tử Vi', position: 'Dần' },
  ],
  // Dương nam (Giáp năm sinh) => thuận. Real, self-consistent values (not arbitrary placeholders) —
  // matches apps/api/src/tu-vi/engine/tu-vi-dai-van.ts / tu-vi-tieu-han.ts's own formulas exactly.
  daiVan: [
    { index: 0, ageStart: 6, ageEnd: 15, role: 'Mệnh', position: 'Dần' },
    { index: 1, ageStart: 16, ageEnd: 25, role: 'Phụ Mẫu', position: 'Mão' },
    { index: 2, ageStart: 26, ageEnd: 35, role: 'Phúc Đức', position: 'Thìn' },
    { index: 3, ageStart: 36, ageEnd: 45, role: 'Điền Trạch', position: 'Tỵ' },
  ],
  tieuHanStart: { startPalace: 'Tuất', thuan: true },
  currentDaiVan: { index: 3, ageStart: 36, ageEnd: 45, role: 'Điền Trạch', position: 'Tỵ' },
  currentTieuHan: { tuoi: 43, lunarYear: 2026, palace: 'Thìn' },
  nearbyTieuHan: [
    { tuoi: 41, lunarYear: 2024, palace: 'Dần' },
    { tuoi: 42, lunarYear: 2025, palace: 'Mão' },
    { tuoi: 43, lunarYear: 2026, palace: 'Thìn' },
    { tuoi: 44, lunarYear: 2027, palace: 'Tỵ' },
    { tuoi: 45, lunarYear: 2028, palace: 'Ngọ' },
  ],
  interpretation: null,
  interpretedAt: null,
  createdAt: '2026-08-21T00:00:00.000Z',
  updatedAt: '2026-08-21T00:00:00.000Z',
  archivedAt: null,
};

const listResult: ListTuViChartsResultDto = { items: [chart], total: 1, page: 1, pageSize: 20 };

describe('TuViDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParamsValue = '';
  });

  it('renders the birth-data form and real lá số history by default', async () => {
    (tuViApi.listCharts as jest.Mock).mockResolvedValue(listResult);
    renderWithQuery(<TuViDashboard />);
    expect(screen.getByRole('heading', { name: 'Lá số Tử Vi', level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /lập lá số của tôi/i })).toBeInTheDocument();
    expect(await screen.findByText(/Hỏa Lục Cục — Mệnh tại Dần/)).toBeInTheDocument();
  });

  it('shows the chart calculation trust section before the user has calculated anything', async () => {
    (tuViApi.listCharts as jest.Mock).mockResolvedValue(listResult);
    renderWithQuery(<TuViDashboard />);
    expect(screen.getByRole('button', { name: /Cách Mệnh Vi lập lá số/i })).toBeInTheDocument();
  });

  it('never mentions Ngũ Hành Phương Đông / Eastern Horoscope routes on this page', async () => {
    (tuViApi.listCharts as jest.Mock).mockResolvedValue(listResult);
    const { container } = renderWithQuery(<TuViDashboard />);
    await screen.findByText(/Hỏa Lục Cục/);
    const hrefs = Array.from(container.querySelectorAll('a')).map((a) => a.getAttribute('href'));
    expect(hrefs.some((href) => href?.includes('eastern-horoscope'))).toBe(false);
  });

  it('shows an empty state when there is no history yet', async () => {
    (tuViApi.listCharts as jest.Mock).mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 });
    renderWithQuery(<TuViDashboard />);
    expect(await screen.findByText('Chưa có lá số')).toBeInTheDocument();
  });

  it('opening ?item=<id> renders the real chart detail instead of the form/history view', async () => {
    mockSearchParamsValue = 'item=c1';
    (tuViApi.getChart as jest.Mock).mockResolvedValue(chart);
    renderWithQuery(<TuViDashboard />);

    expect(await screen.findByText('Lá số đã an')).toBeInTheDocument();
    expect(tuViApi.getChart).toHaveBeenCalledWith('c1');
    expect(screen.queryByRole('button', { name: /lập lá số của tôi/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '← Quay lại Lá số Tử Vi' })).toBeInTheDocument();
  });

  it('shows the Đại Vận timeline and Tiểu Hạn year nav in the real chart detail view, with the current period pre-selected', async () => {
    mockSearchParamsValue = 'item=c1';
    (tuViApi.getChart as jest.Mock).mockResolvedValue(chart);
    renderWithQuery(<TuViDashboard />);

    await screen.findByText('Lá số đã an');
    expect(screen.getByRole('tab', { name: /36–45/ })).toHaveAttribute('aria-current', 'true');
    expect(screen.getByText('2026')).toBeInTheDocument();
    expect(screen.getByText(/43 tuổi · hiện tại/)).toBeInTheDocument();
  });

  it('closing the detail view navigates back to the plain /discover/tu-vi route', async () => {
    mockSearchParamsValue = 'item=c1';
    (tuViApi.getChart as jest.Mock).mockResolvedValue(chart);
    const user = userEvent.setup();
    renderWithQuery(<TuViDashboard />);

    await screen.findByText('Lá số đã an');
    await user.click(screen.getByRole('button', { name: '← Quay lại Lá số Tử Vi' }));
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/discover/tu-vi', { scroll: false }));
  });

  it('the deterministic chart facts and the interpretation are visually/structurally distinct', async () => {
    mockSearchParamsValue = 'item=c1';
    (tuViApi.getChart as jest.Mock).mockResolvedValue(chart);
    renderWithQuery(<TuViDashboard />);

    await screen.findByText('Lá số đã an');
    expect(screen.getByText(/hệ quy tắc cố định/i)).toBeInTheDocument();
    expect(screen.getByText('Dữ liệu lá số · Tính theo bộ quy tắc cố định')).toBeInTheDocument();
    expect(screen.getByText('Luận giải lá số')).toBeInTheDocument();
    expect(screen.getByText(/Phần luận giải chỉ diễn giải dữ liệu lá số/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cách Mệnh Vi lập lá số/i })).toHaveAttribute('aria-expanded', 'false');
  });

  it('renders all 12 palaces with real, visible role names (accessible textual grid, not decorative-only)', async () => {
    mockSearchParamsValue = 'item=c1';
    (tuViApi.getChart as jest.Mock).mockResolvedValue(chart);
    renderWithQuery(<TuViDashboard />);

    await screen.findByText('Lá số đã an');
    for (const role of ['Mệnh', 'Phụ Mẫu', 'Phúc Đức', 'Điền Trạch', 'Quan Lộc', 'Nô Bộc', 'Thiên Di', 'Tật Ách', 'Tài Bạch', 'Tử Tức', 'Phu Thê', 'Huynh Đệ']) {
      expect(screen.getAllByLabelText(new RegExp(`^Cung ${role},`)).length).toBeGreaterThan(0);
    }
  });

  it('lets keyboard and touch users select a palace and read its real detail', async () => {
    mockSearchParamsValue = 'item=c1';
    (tuViApi.getChart as jest.Mock).mockResolvedValue(chart);
    const user = userEvent.setup();
    renderWithQuery(<TuViDashboard />);

    const careerPalace = (await screen.findAllByRole('button', { name: /^Cung Quan Lộc,/ }))[0]!;
    await user.click(careerPalace);
    expect(careerPalace).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getAllByRole('heading', { name: 'Quan Lộc' }).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Công việc, sự nghiệp và vai trò xã hội').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Không có Tứ Hóa tại cung này.').length).toBeGreaterThan(0);
  });
  it('keeps the selected palace inspector grounded in persisted chart facts and exposes mobile close controls', async () => {
    mockSearchParamsValue = 'item=c1';
    (tuViApi.getChart as jest.Mock).mockResolvedValue(chart);
    const user = userEvent.setup();
    renderWithQuery(<TuViDashboard />);

    const menhButtons = await screen.findAllByRole('button', { name: /^Cung Mệnh,/ });
    await user.click(menhButtons[0]!);

    expect(screen.getAllByText('Bản mệnh và nền tảng cá nhân').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Hóa Lộc · Tử Vi').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/lấy trực tiếp từ lá số đã được Mệnh Vi tính và lưu/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('dialog', { name: 'Mệnh' })).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByRole('button', { name: 'Đóng chi tiết cung' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Đóng chi tiết cung' }));
    expect(screen.queryByRole('button', { name: 'Đóng nền chi tiết cung' })).not.toBeInTheDocument();
  });

});
