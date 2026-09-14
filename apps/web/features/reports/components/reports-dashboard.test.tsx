import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReportDto, ReportReadinessDto } from '@beaconvie/types';
import { renderWithQuery } from '@/test/render-with-query';
import { ApiError } from '@/lib/api-error';
import { toast } from '@/components/ui/toast';
import { ReportsDashboard } from './reports-dashboard';
import { reportsApi } from '../api/reports-api';

const mockReplace = jest.fn();
const mockPush = jest.fn();
let mockSearchParamsValue = '';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace, push: mockPush }),
  useSearchParams: () => new URLSearchParams(mockSearchParamsValue),
}));

jest.mock('@/components/ui/toast', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
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

let mockPremiumQuery = { data: { isPremium: false }, isLoading: false, isError: false };
jest.mock('@/features/premium/hooks/use-premium-status', () => ({
  usePremiumStatus: () => mockPremiumQuery,
}));

const NOT_READY: ReportReadinessDto = {
  ready: false,
  natalChart: { available: false, sourceId: null },
  numerology: { available: false, sourceId: null },
  tarot: { available: false, count: 0 },
  memory: { available: false },
};

const MISSING_NUMEROLOGY: ReportReadinessDto = {
  ...NOT_READY,
  natalChart: { available: true, sourceId: 'natal-1' },
};

const READY: ReportReadinessDto = {
  ready: true,
  natalChart: { available: true, sourceId: 'natal-1' },
  numerology: { available: true, sourceId: 'num-1' },
  tarot: { available: false, count: 0 },
  memory: { available: false },
};

const READY_REPORT: ReportDto = {
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

const EMPTY_LIST = { items: [], total: 0, page: 1, pageSize: 20 };
const SUCCESS_LIST = { items: [{ id: 'report-2', status: 'READY', createdAt: '2026-01-02T00:00:00.000Z' }], total: 1, page: 1, pageSize: 20 };

describe('ReportsDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParamsValue = '';
    mockPremiumQuery = { data: { isPremium: false }, isLoading: false, isError: false };
    (reportsApi.listReports as jest.Mock).mockResolvedValue(EMPTY_LIST);
  });

  it('shows readiness loading as loading, not missing-source content', () => {
    (reportsApi.readiness as jest.Mock).mockReturnValue(new Promise(() => undefined));
    renderWithQuery(<ReportsDashboard />);

    expect(screen.getByRole('status', { name: 'Đang kiểm tra nguồn dữ liệu báo cáo' })).toBeInTheDocument();
    expect(screen.queryByText('Tạo Bản đồ sao')).not.toBeInTheDocument();
  });

  it('shows the ready source checklist without required CTAs when both required sources exist', async () => {
    (reportsApi.readiness as jest.Mock).mockResolvedValue(READY);
    renderWithQuery(<ReportsDashboard />);

    expect(await screen.findByText('Bản đồ sao')).toBeInTheDocument();
    expect(screen.queryByText('Tạo Bản đồ sao')).not.toBeInTheDocument();
    expect(screen.queryByText('Tạo Thần số học')).not.toBeInTheDocument();
  });

  it('shows missing Natal Chart and disables generation when required sources are not ready', async () => {
    (reportsApi.readiness as jest.Mock).mockResolvedValue(NOT_READY);
    renderWithQuery(<ReportsDashboard />);

    expect(await screen.findByText('Tạo Bản đồ sao')).toBeInTheDocument();
    expect(screen.getByText('Tạo Thần số học')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /nâng cấp để tạo báo cáo/i })).toBeDisabled();
  });

  it('shows missing Numerology without hiding the available Natal Chart', async () => {
    (reportsApi.readiness as jest.Mock).mockResolvedValue(MISSING_NUMEROLOGY);
    renderWithQuery(<ReportsDashboard />);

    expect(await screen.findByText('Bản đồ sao')).toBeInTheDocument();
    expect(screen.queryByText('Tạo Bản đồ sao')).not.toBeInTheDocument();
    expect(screen.getByText('Tạo Thần số học')).toBeInTheDocument();
  });

  it('shows readiness API errors as retryable errors, not infinite loading', async () => {
    (reportsApi.readiness as jest.Mock).mockRejectedValue(new ApiError('private backend detail', 'INTERNAL_ERROR', 500));
    renderWithQuery(<ReportsDashboard />);

    expect(await screen.findByText('Chưa thể kiểm tra nguồn báo cáo')).toBeInTheDocument();
    expect(screen.getByText('Chưa thể kiểm tra điều kiện tạo báo cáo.')).toBeInTheDocument();
  });

  it('shows history loading as loading, not empty history', async () => {
    (reportsApi.readiness as jest.Mock).mockResolvedValue(READY);
    (reportsApi.listReports as jest.Mock).mockReturnValue(new Promise(() => undefined));
    renderWithQuery(<ReportsDashboard />);

    expect(await screen.findByRole('status', { name: 'Đang tải lịch sử báo cáo' })).toBeInTheDocument();
    expect(screen.queryByText('Chưa có báo cáo')).not.toBeInTheDocument();
  });

  it('shows a true empty state when there is no report history yet', async () => {
    (reportsApi.readiness as jest.Mock).mockResolvedValue(NOT_READY);
    renderWithQuery(<ReportsDashboard />);

    expect(await screen.findByText('Chưa có báo cáo')).toBeInTheDocument();
  });

  it('shows report history success and opens the selected report', async () => {
    (reportsApi.readiness as jest.Mock).mockResolvedValue(READY);
    (reportsApi.listReports as jest.Mock).mockResolvedValue(SUCCESS_LIST);
    const user = userEvent.setup();
    renderWithQuery(<ReportsDashboard />);

    await user.click(await screen.findByRole('button', { name: /báo cáo định mệnh cá nhân/i }));
    expect(mockReplace).toHaveBeenCalledWith('/reports?item=report-2', { scroll: false });
  });

  it('shows history API errors as retryable errors, not "no reports yet"', async () => {
    (reportsApi.readiness as jest.Mock).mockResolvedValue(READY);
    (reportsApi.listReports as jest.Mock).mockRejectedValue(new ApiError('private backend detail', 'INTERNAL_ERROR', 500));
    renderWithQuery(<ReportsDashboard />);

    expect(await screen.findByText('Chưa thể tải lịch sử báo cáo')).toBeInTheDocument();
    expect(screen.queryByText('Chưa có báo cáo')).not.toBeInTheDocument();
  });

  it('gates a ready free user through Premium without calling generate', async () => {
    (reportsApi.readiness as jest.Mock).mockResolvedValue(READY);
    const user = userEvent.setup();
    renderWithQuery(<ReportsDashboard />);

    await user.click(await screen.findByRole('button', { name: /nâng cấp để tạo báo cáo/i }));
    expect(mockPush).toHaveBeenCalledWith('/premium?reason=required');
    expect(reportsApi.generate).not.toHaveBeenCalled();
  });

  it('opens the resulting report after a Premium generation succeeds', async () => {
    (reportsApi.readiness as jest.Mock).mockResolvedValue(READY);
    mockPremiumQuery = { data: { isPremium: true }, isLoading: false, isError: false };
    (reportsApi.generate as jest.Mock).mockResolvedValue(READY_REPORT);
    const user = userEvent.setup();
    renderWithQuery(<ReportsDashboard />);

    await user.click(await screen.findByRole('button', { name: /tạo báo cáo của tôi/i }));
    await waitFor(() => expect(reportsApi.generate).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/reports?item=report-1', { scroll: false }));
  });

  it('keeps the generate button pending and prevents duplicate generate submissions', async () => {
    (reportsApi.readiness as jest.Mock).mockResolvedValue(READY);
    mockPremiumQuery = { data: { isPremium: true }, isLoading: false, isError: false };
    (reportsApi.generate as jest.Mock).mockReturnValue(new Promise(() => undefined));
    const user = userEvent.setup();
    renderWithQuery(<ReportsDashboard />);

    const button = await screen.findByRole('button', { name: /tạo báo cáo của tôi/i });
    await user.click(button);
    await user.click(button);

    expect(reportsApi.generate).toHaveBeenCalledTimes(1);
    expect(button).toBeDisabled();
  });

  it('shows a safe generation failure message', async () => {
    (reportsApi.readiness as jest.Mock).mockResolvedValue(READY);
    mockPremiumQuery = { data: { isPremium: true }, isLoading: false, isError: false };
    (reportsApi.generate as jest.Mock).mockRejectedValue(new ApiError('provider stack trace', 'INTERNAL_ERROR', 500));
    const user = userEvent.setup();
    renderWithQuery(<ReportsDashboard />);

    await user.click(await screen.findByRole('button', { name: /tạo báo cáo của tôi/i }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Chưa thể tạo báo cáo lúc này. Vui lòng thử lại.'));
  });
});
