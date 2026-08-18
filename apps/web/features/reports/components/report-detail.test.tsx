import { screen } from '@testing-library/react';
import type { ReportDto } from '@beaconvie/types';
import { renderWithQuery } from '@/test/render-with-query';
import { ReportDetail } from './report-detail';
import { reportsApi } from '../api/reports-api';

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
  methodology: 'This report combines calculation and AI narrative — read as reflection, not prediction.',
};

describe('ReportDetail', () => {
  const onClose = jest.fn();
  const onRegenerated = jest.fn();

  beforeEach(() => jest.clearAllMocks());

  it('renders a honest "generating" state without any AI content while status is GENERATING', async () => {
    (reportsApi.getReport as jest.Mock).mockResolvedValue({ ...BASE_REPORT, status: 'GENERATING', result: null, failureReason: null });
    renderWithQuery(<ReportDetail id="report-1" onClose={onClose} onRegenerated={onRegenerated} />);
    expect(await screen.findByText(/Connecting a few things/i)).toBeInTheDocument();
  });

  it('renders an honest failure state with a retry action, never a fabricated report, when status is FAILED', async () => {
    (reportsApi.getReport as jest.Mock).mockResolvedValue({ ...BASE_REPORT, status: 'FAILED', result: null, failureReason: 'VALIDATION_FAILED' });
    renderWithQuery(<ReportDetail id="report-1" onClose={onClose} onRegenerated={onRegenerated} />);
    expect(await screen.findByText('This report couldn’t be generated')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('renders the structured sections and clearly labels the Calculated Facts appendix as deterministic, never AI-generated, when READY', async () => {
    (reportsApi.getReport as jest.Mock).mockResolvedValue({ ...BASE_REPORT, status: 'READY', result: READY_RESULT, failureReason: null });
    renderWithQuery(<ReportDetail id="report-1" onClose={onClose} onRegenerated={onRegenerated} />);

    expect(await screen.findByText('An honest overview of your report.')).toBeInTheDocument();
    expect(screen.getByText('Your core identity narrative.')).toBeInTheDocument();
    expect(screen.getByText('A Strength')).toBeInTheDocument();
    expect(screen.getByText('Deterministic — never AI-generated')).toBeInTheDocument();
    // Calculated fact from the snapshot appears, distinct from the AI narrative sections above.
    expect(screen.getByText(/SUN in Aries/)).toBeInTheDocument();
    // Optional sections are correctly absent, never invented, when their source wasn't used.
    expect(screen.queryByText('Current Themes')).not.toBeInTheDocument();
    expect(screen.queryByText('Personalized Reflection')).not.toBeInTheDocument();
    // Companion bridge is present and read-only (a plain link, not a mutation control).
    expect(screen.getByRole('link', { name: /ask companion about this report/i })).toHaveAttribute('href', '/companion');
  });

  it('shows optional sections (Current Themes / Personalized Reflection) only when their source was actually used', async () => {
    (reportsApi.getReport as jest.Mock).mockResolvedValue({
      ...BASE_REPORT,
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
    expect(screen.getByText('From recent Tarot context')).toBeInTheDocument();
    expect(screen.getByText('From your Memory')).toBeInTheDocument();
  });
});
