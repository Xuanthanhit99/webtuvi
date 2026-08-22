import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ListNatalChartsResultDto, NatalChartDto } from '@beaconvie/types';
import { renderWithQuery } from '@/test/render-with-query';
import { NatalChartDashboard } from './natal-chart-dashboard';
import { natalChartApi } from '../api/natal-chart-api';

const mockReplace = jest.fn();
let mockSearchParamsValue = '';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => new URLSearchParams(mockSearchParamsValue),
}));

jest.mock('../api/natal-chart-api', () => ({
  natalChartApi: {
    listCharts: jest.fn(),
    getChart: jest.fn(),
    create: jest.fn(),
  },
  geocodingApi: { search: jest.fn() },
}));

jest.mock('@/features/premium/hooks/use-premium-status', () => ({
  usePremiumStatus: () => ({ data: { isPremium: false } }),
}));

const chart: NatalChartDto = {
  id: 'c1',
  status: 'ACTIVE',
  visibility: 'COMPANION_VISIBLE',
  birthDate: '2000-06-15',
  birthTime: '14:30',
  birthTimeKnown: true,
  birthPlaceLabel: 'Hà Nội, Vietnam',
  timezone: 'Asia/Ho_Chi_Minh',
  zodiacMode: 'tropical',
  houseSystem: 'placidus',
  housesAvailable: true,
  calculationVersion: 'natal-chart-circular-horoscope-v1',
  engineVersion: '1.1.0',
  ascendant: { longitude: 209.87, sign: 'libra', degreeInSign: 29.87, meaning: 'Ascendant (Rising Sign) in Libra (relational, balance-seeking)' },
  midheaven: { longitude: 280, sign: 'capricorn', degreeInSign: 10, meaning: 'Midheaven in Capricorn (ambitious, disciplined)' },
  placements: [
    { body: 'sun', longitude: 84.5, sign: 'gemini', degreeInSign: 24.5, house: 8, retrograde: false, meaning: 'Sun (core identity) in Gemini (curious, adaptable) — the 8th house (shared resources)' },
    { body: 'moon', longitude: 246.6, sign: 'sagittarius', degreeInSign: 6.6, house: 2, retrograde: false, meaning: 'Moon (emotional nature) in Sagittarius (exploratory) — the 2nd house (money, value)' },
    { body: 'mercury', longitude: 90, sign: 'cancer', degreeInSign: 0, house: 9, retrograde: false, meaning: 'Mercury in Cancer — 9th house' },
    { body: 'venus', longitude: 100, sign: 'cancer', degreeInSign: 10, house: 9, retrograde: false, meaning: 'Venus in Cancer — 9th house' },
    { body: 'mars', longitude: 120, sign: 'leo', degreeInSign: 0, house: 10, retrograde: false, meaning: 'Mars in Leo — 10th house' },
    { body: 'jupiter', longitude: 150, sign: 'virgo', degreeInSign: 0, house: 11, retrograde: false, meaning: 'Jupiter in Virgo — 11th house' },
    { body: 'saturn', longitude: 180, sign: 'libra', degreeInSign: 0, house: 12, retrograde: false, meaning: 'Saturn in Libra — 12th house' },
    { body: 'uranus', longitude: 210, sign: 'scorpio', degreeInSign: 0, house: 1, retrograde: false, meaning: 'Uranus in Scorpio — 1st house' },
    { body: 'neptune', longitude: 240, sign: 'sagittarius', degreeInSign: 0, house: 2, retrograde: true, meaning: 'Neptune in Sagittarius — 2nd house' },
    { body: 'pluto', longitude: 270, sign: 'capricorn', degreeInSign: 0, house: 3, retrograde: false, meaning: 'Pluto in Capricorn — 3rd house' },
  ],
  houses: Array.from({ length: 12 }, (_, i) => ({ number: i + 1, cuspLongitude: i * 30, sign: 'aries' as const })),
  aspects: [{ pointA: 'sun', pointB: 'venus', type: 'conjunction', orb: 1.2, angle: 1.2, meaning: 'Sun Conjunction Venus — fused warmth' }],
  interpretation: null,
  interpretedAt: null,
  createdAt: '2026-01-05T00:00:00.000Z',
  updatedAt: '2026-01-05T00:00:00.000Z',
  archivedAt: null,
};

const listResult: ListNatalChartsResultDto = { items: [chart], total: 1, page: 1, pageSize: 20 };

describe('NatalChartDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParamsValue = '';
  });

  it('renders the birth-data form and real chart history by default', async () => {
    (natalChartApi.listCharts as jest.Mock).mockResolvedValue(listResult);
    renderWithQuery(<NatalChartDashboard />);
    expect(screen.getByRole('heading', { name: 'Bầu trời tại khoảnh khắc bạn sinh ra' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /calculate my chart/i })).toBeInTheDocument();
    expect(await screen.findByText('Hà Nội, Vietnam')).toBeInTheDocument();
  });

  it('shows an empty state when there is no history yet', async () => {
    (natalChartApi.listCharts as jest.Mock).mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 });
    renderWithQuery(<NatalChartDashboard />);
    expect(await screen.findByText('No charts yet')).toBeInTheDocument();
  });

  it('opening ?item=<id> renders the real chart detail instead of the form/history view', async () => {
    mockSearchParamsValue = 'item=c1';
    (natalChartApi.getChart as jest.Mock).mockResolvedValue(chart);
    renderWithQuery(<NatalChartDashboard />);

    expect(await screen.findByText('Hà Nội, Vietnam')).toBeInTheDocument();
    expect(natalChartApi.getChart).toHaveBeenCalledWith('c1');
    expect(screen.queryByRole('button', { name: /calculate my chart/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '← Back to Natal Chart' })).toBeInTheDocument();
  });

  it('closing the detail view navigates back to the plain /discover/natal-chart route', async () => {
    mockSearchParamsValue = 'item=c1';
    (natalChartApi.getChart as jest.Mock).mockResolvedValue(chart);
    const user = userEvent.setup();
    renderWithQuery(<NatalChartDashboard />);

    await screen.findByText('Hà Nội, Vietnam');
    await user.click(screen.getByRole('button', { name: '← Back to Natal Chart' }));
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/discover/natal-chart', { scroll: false }));
  });

  it('the calculated chart facts and the AI interpretation are visually/structurally distinct (Sprint 8.5 AI-labeling discipline)', async () => {
    mockSearchParamsValue = 'item=c1';
    (natalChartApi.getChart as jest.Mock).mockResolvedValue(chart);
    renderWithQuery(<NatalChartDashboard />);

    await screen.findByText('Hà Nội, Vietnam');
    expect(screen.getByText(/calculated from your birth data/i)).toBeInTheDocument();
    expect(screen.getByText('AI Interpretation')).toBeInTheDocument();
    expect(screen.getByText(/written by ai/i)).toBeInTheDocument();
  });
});
