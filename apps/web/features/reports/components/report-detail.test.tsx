import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReportDto } from '@beaconvie/types';
import { renderWithQuery } from '@/test/render-with-query';
import { toast } from '@/components/ui/toast';
import { ReportDetail } from './report-detail';
import { reportsApi } from '../api/reports-api';

jest.mock('@/components/ui/toast', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock('../api/reports-api', () => ({
  reportsApi: {
    getReport: jest.fn(),
    regenerate: jest.fn(),
  },
}));

jest.mock('@/features/premium/hooks/use-premium-status', () => ({
  usePremiumStatus: () => ({ data: { isPremium: true } }),
}));

const BASE_REPORT: Omit<ReportDto, 'status' | 'result' | 'failureReason'> = {
  id: 'report-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  completedAt: '2026-01-01T00:00:05.000Z',
  reportSchemaVersion: 'v1',
  reportTemplateVersion: 'v1',
  aiPromptVersion: 'v1',
  sourceSnapshot: {
    natalChart: {
      sourceId: 'natal-1',
      calculationVersion: 'v1',
      engineVersion: 'v1',
      ascendant: null,
      midheaven: null,
      placements: [{ body: 'SUN', sign: 'Aries', degreeInSign: 5, house: 1, retrograde: false, meaning: 'Sun in Aries' }],
      aspects: [],
    },
    numerology: { sourceId: 'num-1', calculationVersion: 'v1', values: [{ type: 'LIFE_PATH', value: 7, isMasterNumber: false, meaning: 'Life Path 7' }] },
    tarot: null,
    memory: null,
  },
  aiProvider: 'MOCK',
  aiModel: 'mock-model',
};

const READY_RESULT = {
  overview: 'An honest overview of your report.',
  coreIdentity: { narrative: 'Your core identity narrative.', evidenceRefs: ['natalChart:placement:SUN'] },
  strengths: [{ title: 'A Strength', narrative: 'Strength narrative.', evidenceRefs: ['numerology:LIFE_PATH'] }],
  growthAreas: [{ title: 'A Growth Area', narrative: 'Growth narrative.', evidenceRefs: ['natalChart:placement:SUN'] }],
  relationships: { narrative: 'Relationships narrative.', evidenceRefs: ['natalChart:placement:SUN'] },
  careerDirection: { narrative: 'Career narrative.', evidenceRefs: ['numerology:LIFE_PATH'] },
  currentThemes: null,
  personalizedReflection: null,
  sourceHighlights: [{ source: 'Numerology', fact: 'Life Path 7' }],
  methodology: 'This report combines calculation and AI narrative as reflection, not prediction.',
};

const READY_REPORT: ReportDto = { ...BASE_REPORT, status: 'READY', result: READY_RESULT, failureReason: null };

describe('ReportDetail', () => {
  const onClose = jest.fn();
  const onRegenerated = jest.fn();

  beforeEach(() => jest.clearAllMocks());

  it('renders a loading state while the detail query is pending', () => {
    (reportsApi.getReport as jest.Mock).mockReturnValue(new Promise(() => undefined));
    renderWithQuery(<ReportDetail id="report-1" onClose={onClose} onRegenerated={onRegenerated} />);

    expect(screen.getByRole('status', { name: 'Đang tải báo cáo' })).toBeInTheDocument();
  });

  it('renders a retryable detail error state', async () => {
    (reportsApi.getReport as jest.Mock).mockRejectedValue(new Error('network down'));
    renderWithQuery(<ReportDetail id="report-1" onClose={onClose} onRegenerated={onRegenerated} />);

    expect(await screen.findByText('Chưa thể tải báo cáo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /thử lại/i })).toBeInTheDocument();
  });

  it('renders an honest generating state without any AI content while status is GENERATING', async () => {
    (reportsApi.getReport as jest.Mock).mockResolvedValue({ ...BASE_REPORT, status: 'GENERATING', result: null, failureReason: null });
    renderWithQuery(<ReportDetail id="report-1" onClose={onClose} onRegenerated={onRegenerated} />);

    expect(await screen.findByText(/đang kết nối/i)).toBeInTheDocument();
  });

  it('renders an honest failure state with a retry action, never a fabricated report, when status is FAILED', async () => {
    (reportsApi.getReport as jest.Mock).mockResolvedValue({ ...BASE_REPORT, status: 'FAILED', result: null, failureReason: 'VALIDATION_FAILED' });
    renderWithQuery(<ReportDetail id="report-1" onClose={onClose} onRegenerated={onRegenerated} />);

    expect(await screen.findByText('Báo cáo chưa tạo được')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /thử lại/i })).toBeInTheDocument();
  });

  it('renders the structured report and transparent source appendix when READY', async () => {
    (reportsApi.getReport as jest.Mock).mockResolvedValue(READY_REPORT);
    renderWithQuery(<ReportDetail id="report-1" onClose={onClose} onRegenerated={onRegenerated} />);

    expect(await screen.findByText('An honest overview of your report.')).toBeInTheDocument();
    expect(screen.getByText('Your core identity narrative.')).toBeInTheDocument();
    expect(screen.getByText('A Strength')).toBeInTheDocument();
    expect(screen.getByText('Nguồn đã dùng')).toBeInTheDocument();
    expect(screen.getByText('1 vị trí hành tinh/điểm chính')).toBeInTheDocument();
    expect(screen.getByText('1 chỉ số đã tính')).toBeInTheDocument();
    expect(screen.getByText('Dữ kiện cố định, không do AI tạo')).toBeInTheDocument();
    expect(screen.getByText(/SUN ở Aries/)).toBeInTheDocument();
    expect(screen.queryByText('Chủ đề hiện tại')).not.toBeInTheDocument();
    expect(screen.queryByText('Suy ngẫm cá nhân')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /hỏi companion về báo cáo này/i })).toHaveAttribute('href', '/companion');
  });

  it('renders optional source sections only when their source was actually used', async () => {
    (reportsApi.getReport as jest.Mock).mockResolvedValue({
      ...BASE_REPORT,
      sourceSnapshot: {
        ...BASE_REPORT.sourceSnapshot,
        tarot: [{ readingId: 'tarot-1', createdAt: '2026-01-01T00:00:00.000Z', spreadType: 'SINGLE', cards: [{ name: 'The Sun', position: null, orientation: 'UPRIGHT', keywords: [] }], summary: 'Tarot summary' }],
        memory: [{ memoryId: 'memory-1', content: 'Allowed memory', topics: [] }],
      },
      status: 'READY',
      failureReason: null,
      result: {
        ...READY_RESULT,
        currentThemes: { narrative: 'A real Tarot-derived theme.', evidenceRefs: [] },
        personalizedReflection: { narrative: 'A real Memory-derived reflection.', evidenceRefs: [] },
      },
    });
    renderWithQuery(<ReportDetail id="report-1" onClose={onClose} onRegenerated={onRegenerated} />);

    expect(await screen.findByText('A real Tarot-derived theme.')).toBeInTheDocument();
    expect(screen.getByText('A real Memory-derived reflection.')).toBeInTheDocument();
    expect(screen.getByText('Từ Tarot gần đây')).toBeInTheDocument();
    expect(screen.getByText('Từ Ký ức đã cho phép')).toBeInTheDocument();
    expect(screen.getByText('1 trải bài gần đây')).toBeInTheDocument();
    expect(screen.getByText('1 ký ức đã được phép dùng')).toBeInTheDocument();
  });

  it('regenerates a ready report and opens the new version', async () => {
    (reportsApi.getReport as jest.Mock).mockResolvedValue(READY_REPORT);
    (reportsApi.regenerate as jest.Mock).mockResolvedValue({ ...READY_REPORT, id: 'report-2' });
    const user = userEvent.setup();
    renderWithQuery(<ReportDetail id="report-1" onClose={onClose} onRegenerated={onRegenerated} />);

    await user.click(await screen.findByRole('button', { name: /tạo phiên bản mới/i }));
    await waitFor(() => expect(reportsApi.regenerate).toHaveBeenCalledWith('report-1'));
    expect(onRegenerated).toHaveBeenCalledWith('report-2');
  });

  it('prevents duplicate regenerate submissions from the FAILED state retry button', async () => {
    // ErrorState's retry button has no pending state of its own, so without an explicit guard a
    // second click fires another POST that the server's generation lock rejects with
    // REPORT_GENERATION_IN_PROGRESS — an error toast caused by the user's own double-click.
    (reportsApi.getReport as jest.Mock).mockResolvedValue({ ...BASE_REPORT, status: 'FAILED', result: null, failureReason: 'PROVIDER_UNAVAILABLE' });
    (reportsApi.regenerate as jest.Mock).mockReturnValue(new Promise(() => undefined));
    const user = userEvent.setup();
    renderWithQuery(<ReportDetail id="report-1" onClose={onClose} onRegenerated={onRegenerated} />);

    const retry = await screen.findByRole('button', { name: /thử lại/i });
    await user.click(retry);
    await user.click(retry);

    expect(reportsApi.regenerate).toHaveBeenCalledTimes(1);
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('prevents duplicate regenerate submissions from the READY state button', async () => {
    (reportsApi.getReport as jest.Mock).mockResolvedValue(READY_REPORT);
    (reportsApi.regenerate as jest.Mock).mockReturnValue(new Promise(() => undefined));
    const user = userEvent.setup();
    renderWithQuery(<ReportDetail id="report-1" onClose={onClose} onRegenerated={onRegenerated} />);

    const button = await screen.findByRole('button', { name: /tạo phiên bản mới/i });
    await user.click(button);
    await user.click(button);

    expect(reportsApi.regenerate).toHaveBeenCalledTimes(1);
    expect(button).toBeDisabled();
  });

  it('shows a safe regenerate failure message', async () => {
    (reportsApi.getReport as jest.Mock).mockResolvedValue(READY_REPORT);
    (reportsApi.regenerate as jest.Mock).mockRejectedValue(new Error('provider stack trace'));
    const user = userEvent.setup();
    renderWithQuery(<ReportDetail id="report-1" onClose={onClose} onRegenerated={onRegenerated} />);

    await user.click(await screen.findByRole('button', { name: /tạo phiên bản mới/i }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Chưa thể tạo lại báo cáo lúc này. Vui lòng thử lại.'));
  });
});

describe('ReportDetail — GENERATING status accessibility + polling', () => {
  beforeEach(() => jest.clearAllMocks());

  it('polls while GENERATING and stops once the report resolves', async () => {
    // A report genuinely mid-generation was created moments ago — BASE_REPORT's fixed 2026-01-01
    // date would be long past the point where any server-side generation could still be running.
    const justNow = new Date().toISOString();
    (reportsApi.getReport as jest.Mock)
      .mockResolvedValueOnce({ ...BASE_REPORT, createdAt: justNow, status: 'GENERATING', result: null, failureReason: null })
      .mockResolvedValue({ ...BASE_REPORT, createdAt: justNow, status: 'READY', result: READY_RESULT, failureReason: null });
    renderWithQuery(<ReportDetail id="report-1" onClose={jest.fn()} onRegenerated={jest.fn()} />);

    await screen.findByRole('status');

    await waitFor(() => expect(screen.getByText('An honest overview of your report.')).toBeInTheDocument(), { timeout: 5000 });
    expect((reportsApi.getReport as jest.Mock).mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('stops polling a report left GENERATING far past any possible server-side generation window', async () => {
    // Generation is synchronous and the server's concurrency lock self-heals after 2 minutes, so a
    // row this old died with its request. Polling it every 2s for the life of the tab is pure waste.
    const stale = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    (reportsApi.getReport as jest.Mock).mockResolvedValue({ ...BASE_REPORT, createdAt: stale, status: 'GENERATING', result: null, failureReason: null });
    renderWithQuery(<ReportDetail id="report-1" onClose={jest.fn()} onRegenerated={jest.fn()} />);

    await screen.findByText(/đang kết nối/i);
    const callsAfterFirstLoad = (reportsApi.getReport as jest.Mock).mock.calls.length;

    await new Promise((resolve) => setTimeout(resolve, 2500));

    expect((reportsApi.getReport as jest.Mock).mock.calls.length).toBe(callsAfterFirstLoad);
  });
});
