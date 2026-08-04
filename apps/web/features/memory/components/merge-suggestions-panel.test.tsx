import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithQuery } from '@/test/render-with-query';
import { MergeSuggestionsPanel } from './merge-suggestions-panel';
import { memoryApi } from '../api/memory-api';

jest.mock('../api/memory-api', () => ({
  memoryApi: {
    intelligence: {
      mergeSuggestions: {
        list: jest.fn(),
        accept: jest.fn(),
        reject: jest.fn(),
      },
    },
  },
}));

const SUGGESTION = {
  id: 'sug-1',
  primaryMemoryId: 'mem-2',
  primaryTitle: 'Coffee lover',
  duplicateMemoryId: 'mem-1',
  duplicateTitle: 'Coffee',
  confidence: 95,
  reason: 'These two memories say exactly the same thing.',
  status: 'PENDING' as const,
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('MergeSuggestionsPanel', () => {
  it('shows an empty state when there are no suggestions', async () => {
    (memoryApi.intelligence.mergeSuggestions.list as jest.Mock).mockResolvedValue([]);

    renderWithQuery(<MergeSuggestionsPanel />);

    expect(await screen.findByText('No merge suggestions.')).toBeInTheDocument();
  });

  it('shows a suggestion with which memory would be kept vs archived', async () => {
    (memoryApi.intelligence.mergeSuggestions.list as jest.Mock).mockResolvedValue([SUGGESTION]);

    renderWithQuery(<MergeSuggestionsPanel />);

    expect(await screen.findByText('Coffee lover')).toBeInTheDocument();
    expect(screen.getByText('Coffee')).toBeInTheDocument();
    expect(screen.getByText('95% confident')).toBeInTheDocument();
  });

  it('accepting a suggestion calls the accept API', async () => {
    (memoryApi.intelligence.mergeSuggestions.list as jest.Mock).mockResolvedValue([SUGGESTION]);
    (memoryApi.intelligence.mergeSuggestions.accept as jest.Mock).mockResolvedValue({ ...SUGGESTION, status: 'ACCEPTED' });
    const user = userEvent.setup();

    renderWithQuery(<MergeSuggestionsPanel />);
    await screen.findByText('Coffee lover');
    await user.click(screen.getByRole('button', { name: /^merge$/i }));

    await waitFor(() => expect(memoryApi.intelligence.mergeSuggestions.accept).toHaveBeenCalledWith('sug-1'));
  });

  it('rejecting a suggestion calls the reject API', async () => {
    (memoryApi.intelligence.mergeSuggestions.list as jest.Mock).mockResolvedValue([SUGGESTION]);
    (memoryApi.intelligence.mergeSuggestions.reject as jest.Mock).mockResolvedValue({ ...SUGGESTION, status: 'REJECTED' });
    const user = userEvent.setup();

    renderWithQuery(<MergeSuggestionsPanel />);
    await screen.findByText('Coffee lover');
    await user.click(screen.getByRole('button', { name: /not duplicates/i }));

    await waitFor(() => expect(memoryApi.intelligence.mergeSuggestions.reject).toHaveBeenCalledWith('sug-1'));
  });
});
