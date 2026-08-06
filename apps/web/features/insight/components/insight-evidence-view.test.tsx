import { screen, waitFor } from '@testing-library/react';
import { renderWithQuery } from '@/test/render-with-query';
import { InsightEvidenceView } from './insight-evidence-view';
import { insightApi } from '../api/insight-api';

jest.mock('../api/insight-api', () => ({
  insightApi: { evidence: jest.fn() },
}));

describe('InsightEvidenceView', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders each evidence reflection with a real link back to it', async () => {
    (insightApi.evidence as jest.Mock).mockResolvedValue([
      {
        reflectionCandidateId: 'r1',
        reflectionCategory: 'TOPIC',
        reflectionScore: 55,
        reflectionState: 'READY',
        contribution: 'Repeated topic, score 55.',
        href: '/reflections?item=r1',
        sources: [],
      },
    ]);
    renderWithQuery(<InsightEvidenceView insightId="i1" />);
    expect(await screen.findByText('Repeated topic, score 55.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View reflection' })).toHaveAttribute('href', '/reflections?item=r1');
  });

  it('JOURNAL and MEMORY sources deep-link; ACTIVITY/COMPANION render as plain, non-clickable rows', async () => {
    (insightApi.evidence as jest.Mock).mockResolvedValue([
      {
        reflectionCandidateId: 'r1',
        reflectionCategory: 'JOURNAL',
        reflectionScore: 60,
        reflectionState: 'READY',
        contribution: 'x',
        href: '/reflections?item=r1',
        sources: [
          { sourceType: 'JOURNAL', sourceTypeLabel: 'Journal entry', sourceId: 'j1', sourceTimestamp: '2026-01-01T00:00:00.000Z', href: '/journal?item=j1', available: true },
          { sourceType: 'MEMORY', sourceTypeLabel: 'Memory', sourceId: 'm1', sourceTimestamp: '2026-01-01T00:00:00.000Z', href: '/memory?item=m1', available: true },
          { sourceType: 'ACTIVITY', sourceTypeLabel: 'Activity', sourceId: 'a1', sourceTimestamp: '2026-01-01T00:00:00.000Z', href: null, available: true },
        ],
      },
    ]);
    renderWithQuery(<InsightEvidenceView insightId="i1" />);
    await screen.findByText('x');

    expect(screen.getByRole('link', { name: /Journal entry/ })).toHaveAttribute('href', '/journal?item=j1');
    expect(screen.getByRole('link', { name: /Memory/ })).toHaveAttribute('href', '/memory?item=m1');
    expect(screen.getByText('Activity')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Activity/ })).not.toBeInTheDocument();
  });

  it('Phase 8 — a deleted/stale source renders as unavailable, never a dead link', async () => {
    (insightApi.evidence as jest.Mock).mockResolvedValue([
      {
        reflectionCandidateId: 'r1',
        reflectionCategory: 'JOURNAL',
        reflectionScore: 60,
        reflectionState: 'READY',
        contribution: 'x',
        href: '/reflections?item=r1',
        sources: [
          { sourceType: 'JOURNAL', sourceTypeLabel: 'Journal entry', sourceId: 'gone', sourceTimestamp: '2026-01-01T00:00:00.000Z', href: null, available: false },
        ],
      },
    ]);
    renderWithQuery(<InsightEvidenceView insightId="i1" />);
    await screen.findByText('x');
    expect(screen.getByText(/Journal entry \(no longer available\)/)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Journal entry/ })).not.toBeInTheDocument();
  });

  it('shows an honest message when an insight currently has no evidence', async () => {
    (insightApi.evidence as jest.Mock).mockResolvedValue([]);
    renderWithQuery(<InsightEvidenceView insightId="i1" />);
    expect(await screen.findByText('No evidence currently backs this insight.')).toBeInTheDocument();
  });

  it('shows an error state with retry on failure', async () => {
    (insightApi.evidence as jest.Mock).mockRejectedValue(new Error('network'));
    renderWithQuery(<InsightEvidenceView insightId="i1" />);
    await waitFor(() => expect(screen.getByText(/couldn.t load evidence/i)).toBeInTheDocument());
  });
});
