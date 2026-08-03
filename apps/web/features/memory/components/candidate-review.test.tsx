import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithQuery } from '@/test/render-with-query';
import { CandidateReview } from './candidate-review';
import { memoryApi } from '../api/memory-api';

jest.mock('../api/memory-api', () => ({
  memoryApi: {
    candidates: {
      list: jest.fn(),
      accept: jest.fn(),
      reject: jest.fn(),
    },
  },
}));

describe('CandidateReview', () => {
  it('shows an empty state when there is nothing pending', async () => {
    (memoryApi.candidates.list as jest.Mock).mockResolvedValue([]);

    renderWithQuery(<CandidateReview />);

    expect(await screen.findByText('Nothing waiting for review.')).toBeInTheDocument();
  });

  it('shows pending candidates with Remember/Not-this actions', async () => {
    (memoryApi.candidates.list as jest.Mock).mockResolvedValue([
      {
        id: 'cand-1',
        proposedType: 'GOAL',
        proposedTitle: 'New job',
        proposedSummary: 'Starting a new job',
        status: 'CANDIDATE',
        sourceConversationId: 'c1',
        sourceMessageId: 'm1',
        reason: null,
        resultingMemoryId: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        resolvedAt: null,
      },
    ]);

    renderWithQuery(<CandidateReview />);

    expect(await screen.findByText('New job')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /remember this/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /not this/i })).toBeInTheDocument();
  });

  it('flags a consent-blocked candidate distinctly', async () => {
    (memoryApi.candidates.list as jest.Mock).mockResolvedValue([
      {
        id: 'cand-2',
        proposedType: 'HEALTH',
        proposedTitle: 'x',
        proposedSummary: 'x',
        status: 'PENDING_CONSENT',
        sourceConversationId: 'c1',
        sourceMessageId: 'm1',
        reason: null,
        resultingMemoryId: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        resolvedAt: null,
      },
    ]);

    renderWithQuery(<CandidateReview />);

    expect(await screen.findByText(/blocked by your memory settings/i)).toBeInTheDocument();
  });

  it('accepting a candidate calls the API', async () => {
    (memoryApi.candidates.list as jest.Mock).mockResolvedValue([
      {
        id: 'cand-1',
        proposedType: 'GOAL',
        proposedTitle: 'New job',
        proposedSummary: 'x',
        status: 'CANDIDATE',
        sourceConversationId: 'c1',
        sourceMessageId: 'm1',
        reason: null,
        resultingMemoryId: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        resolvedAt: null,
      },
    ]);
    (memoryApi.candidates.accept as jest.Mock).mockResolvedValue({ memory: { id: 'mem-1' }, candidate: {} });
    const user = userEvent.setup();

    renderWithQuery(<CandidateReview />);
    await screen.findByText('New job');
    await user.click(screen.getByRole('button', { name: /remember this/i }));

    await waitFor(() => expect(memoryApi.candidates.accept).toHaveBeenCalledWith('cand-1'));
  });
});
