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
  mainStars: [{ star: 'Tử Vi', position: 'Dần' }],
  auxiliaryStars: [{ star: 'Lộc Tồn', position: 'Dần' }],
  tuan: { first: 'Tuất', second: 'Hợi' },
  triet: { first: 'Thân', second: 'Dậu' },
  transformations: [
    { transformation: 'Hóa Lộc', targetStar: 'Tử Vi', position: 'Dần' },
    { transformation: 'Hóa Quyền', targetStar: 'Tử Vi', position: 'Dần' },
    { transformation: 'Hóa Khoa', targetStar: 'Tử Vi', position: 'Dần' },
    { transformation: 'Hóa Kỵ', targetStar: 'Tử Vi', position: 'Dần' },
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
    expect(screen.getByRole('heading', { name: 'Bản đồ vận mệnh theo hệ Tử Vi Đẩu Số' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /calculate my lá số/i })).toBeInTheDocument();
    expect(await screen.findByText(/Hỏa Lục Cục — Mệnh tại Dần/)).toBeInTheDocument();
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
    expect(await screen.findByText('No lá số yet')).toBeInTheDocument();
  });

  it('opening ?item=<id> renders the real chart detail instead of the form/history view', async () => {
    mockSearchParamsValue = 'item=c1';
    (tuViApi.getChart as jest.Mock).mockResolvedValue(chart);
    renderWithQuery(<TuViDashboard />);

    expect(await screen.findByText('Tổng quan lá số')).toBeInTheDocument();
    expect(tuViApi.getChart).toHaveBeenCalledWith('c1');
    expect(screen.queryByRole('button', { name: /calculate my lá số/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '← Back to Tử Vi Lá Số' })).toBeInTheDocument();
  });

  it('closing the detail view navigates back to the plain /discover/tu-vi route', async () => {
    mockSearchParamsValue = 'item=c1';
    (tuViApi.getChart as jest.Mock).mockResolvedValue(chart);
    const user = userEvent.setup();
    renderWithQuery(<TuViDashboard />);

    await screen.findByText('Tổng quan lá số');
    await user.click(screen.getByRole('button', { name: '← Back to Tử Vi Lá Số' }));
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/discover/tu-vi', { scroll: false }));
  });

  it('the deterministic chart facts and the AI interpretation are visually/structurally distinct', async () => {
    mockSearchParamsValue = 'item=c1';
    (tuViApi.getChart as jest.Mock).mockResolvedValue(chart);
    renderWithQuery(<TuViDashboard />);

    await screen.findByText('Tổng quan lá số');
    expect(screen.getByText(/calculated from your birth data/i)).toBeInTheDocument();
    expect(screen.getByText('Deterministic — never AI-generated')).toBeInTheDocument();
    expect(screen.getByText('AI Interpretation')).toBeInTheDocument();
    expect(screen.getByText(/written by ai/i)).toBeInTheDocument();
  });

  it('renders all 12 palaces with real, visible role names (accessible textual grid, not decorative-only)', async () => {
    mockSearchParamsValue = 'item=c1';
    (tuViApi.getChart as jest.Mock).mockResolvedValue(chart);
    renderWithQuery(<TuViDashboard />);

    await screen.findByText('Tổng quan lá số');
    for (const role of ['Mệnh', 'Phụ Mẫu', 'Phúc Đức', 'Điền Trạch', 'Quan Lộc', 'Nô Bộc', 'Thiên Di', 'Tật Ách', 'Tài Bạch', 'Tử Tức', 'Phu Thê', 'Huynh Đệ']) {
      expect(screen.getAllByLabelText(new RegExp(`^${role} palace`)).length).toBeGreaterThan(0);
    }
  });
});
