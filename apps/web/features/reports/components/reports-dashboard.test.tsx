import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReportDto, ReportReadinessDto } from '@beaconvie/types';
import { renderWithQuery } from '@/test/render-with-query';
import { ReportsDashboard } from './reports-dashboard';
import { reportsApi } from '../api/reports-api';

const mockReplace = jest.fn();
const mockPush = jest.fn();
let mockSearchParamsValue = '';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace, push: mockPush }),
  useSearchParams: () => new URLSearchParams(mockSearchParamsValue),
}));

jest.mock('../api/reports-api', () => ({
  reportsApi: {
    readiness: jest.fn(),
    generate: jest.fn(),
    listReports: jest.fn(),
    getReport: jest.fn(),
    regenerate: jest.fn(),
  },
}));

let mockIsPremium = false;
jest.mock('@/features/premium/hooks/use-premium-status', () => ({
  usePremiumStatus: () => ({ data: { isPremium: mockIsPremium } }),
}));

const NOT_READY: ReportReadinessDto = {
  ready: false,
  natalChart: { available: false, sourceId: null },
  numerology: { available: false, sourceId: null },
  tarot: { available: false, count: 0 },
  memory: { available: false },
};

const READY: ReportReadinessDto = {
  ready: true,
  natalChart: { available: true, sourceId: 'natal-1' },
  numerology: { available: true, sourceId: 'num-1' },
  tarot: { available: false, count: 0 },
  memory: { available: false },
};

const EMPTY_LIST = { items: [], total: 0, page: 1, pageSize: 20 };

describe('ReportsDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParamsValue = '';
    mockIsPremium = false;
    (reportsApi.listReports as jest.Mock).mockResolvedValue(EMPTY_LIST);
  });

  it('shows missing-source CTAs and disables Generate when sources are not ready', async () => {
    (reportsApi.readiness as jest.Mock).mockResolvedValue(NOT_READY);
    renderWithQuery(<ReportsDashboard />);

    expect(await screen.findByText('Calculate your Natal Chart')).toBeInTheDocument();
    expect(screen.getByText('Calculate your Numerology')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /upgrade to generate/i })).toBeDisabled();
  });

  it('shows a Premium upsell (not a Generate button that silently fails) for a ready, free user', async () => {
    (reportsApi.readiness as jest.Mock).mockResolvedValue(READY);
    mockIsPremium = false;
    renderWithQuery(<ReportsDashboard />);

    expect(await screen.findByText(/Personal Destiny Report is a Premium feature/i)).toBeInTheDocument();
    const button = screen.getByRole('button', { name: /upgrade to generate/i });
    await waitFor(() => expect(button).toBeEnabled());
  });

  it('clicking Upgrade for a free, ready user routes to /premium and fires report_upgrade_clicked, without calling generate', async () => {
    (reportsApi.readiness as jest.Mock).mockResolvedValue(READY);
    mockIsPremium = false;
    const user = userEvent.setup();
    renderWithQuery(<ReportsDashboard />);

    await user.click(await screen.findByRole('button', { name: /upgrade to generate/i }));
    expect(mockPush).toHaveBeenCalledWith('/premium?reason=required');
    expect(reportsApi.generate).not.toHaveBeenCalled();
  });

  it('a Premium, ready user can click Generate, which calls the API and opens the resulting report', async () => {
    (reportsApi.readiness as jest.Mock).mockResolvedValue(READY);
    mockIsPremium = true;
    const readyReport: ReportDto = {
      id: 'report-1',
      status: 'READY',
      createdAt: '2026-01-01T00:00:00.000Z',
      completedAt: '2026-01-01T00:00:05.000Z',
      reportSchemaVersion: 'v1',
      reportTemplateVersion: 'v1',
      aiPromptVersion: 'v1',
      sourceSnapshot: { natalChart: {} as never, numerology: {} as never, tarot: null, memory: null },
      result: null,
      aiProvider: 'MOCK',
      aiModel: 'mock-model',
      failureReason: null,
    };
    (reportsApi.generate as jest.Mock).mockResolvedValue(readyReport);
    const user = userEvent.setup();
    renderWithQuery(<ReportsDashboard />);

    await user.click(await screen.findByRole('button', { name: /generate my report/i }));
    await waitFor(() => expect(reportsApi.generate).toHaveBeenCalled());
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/reports?item=report-1', { scroll: false }));
  });

  it('shows an empty state when there is no report history yet', async () => {
    (reportsApi.readiness as jest.Mock).mockResolvedValue(NOT_READY);
    renderWithQuery(<ReportsDashboard />);
    expect(await screen.findByText('No reports yet')).toBeInTheDocument();
  });
});
