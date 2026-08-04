import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithQuery } from '@/test/render-with-query';
import { MemorySuggestionCard } from './memory-suggestion-card';
import { memoryApi } from '@/features/memory/api/memory-api';
import { companionMemoryApi } from '../api/companion-memory-api';

jest.mock('@/features/memory/api/memory-api', () => ({
  memoryApi: {
    candidates: { propose: jest.fn(), accept: jest.fn() },
    consents: { updateType: jest.fn() },
  },
}));

jest.mock('../api/companion-memory-api', () => ({
  companionMemoryApi: {
    dismissSuggestion: jest.fn(),
  },
}));

const suggestion = {
  type: 'GOAL' as const,
  title: 'Learn Japanese',
  summary: 'Working toward JLPT N3',
  reason: 'This sounds worth remembering.',
};

describe('MemorySuggestionCard', () => {
  beforeEach(() => jest.clearAllMocks());

  it('never saves anything just by rendering — no API call happens until a button is pressed', () => {
    renderWithQuery(
      <MemorySuggestionCard suggestion={suggestion} sourceConversationId="conv-1" sourceMessageId="msg-1" onResolved={jest.fn()} />,
    );
    expect(memoryApi.candidates.propose).not.toHaveBeenCalled();
    expect(companionMemoryApi.dismissSuggestion).not.toHaveBeenCalled();
  });

  it('Remember proposes then accepts the existing candidate flow, and resolves the card', async () => {
    (memoryApi.candidates.propose as jest.Mock).mockResolvedValue({ id: 'cand-1', status: 'PENDING' });
    (memoryApi.candidates.accept as jest.Mock).mockResolvedValue({});
    const onResolved = jest.fn();
    const user = userEvent.setup();

    renderWithQuery(
      <MemorySuggestionCard suggestion={suggestion} sourceConversationId="conv-1" sourceMessageId="msg-1" onResolved={onResolved} />,
    );

    await user.click(screen.getByRole('button', { name: 'Remember' }));

    await waitFor(() =>
      expect(memoryApi.candidates.propose).toHaveBeenCalledWith(
        expect.objectContaining({
          proposedType: 'GOAL',
          proposedTitle: 'Learn Japanese',
          sourceConversationId: 'conv-1',
          sourceMessageId: 'msg-1',
        }),
      ),
    );
    expect(memoryApi.candidates.accept).toHaveBeenCalledWith('cand-1');
    await waitFor(() => expect(onResolved).toHaveBeenCalled());
  });

  it('Remember does not call accept when consent leaves the candidate PENDING_CONSENT', async () => {
    (memoryApi.candidates.propose as jest.Mock).mockResolvedValue({ id: 'cand-1', status: 'PENDING_CONSENT' });
    const onResolved = jest.fn();
    const user = userEvent.setup();

    renderWithQuery(
      <MemorySuggestionCard suggestion={suggestion} sourceConversationId="conv-1" sourceMessageId="msg-1" onResolved={onResolved} />,
    );

    await user.click(screen.getByRole('button', { name: 'Remember' }));

    await waitFor(() => expect(memoryApi.candidates.propose).toHaveBeenCalled());
    expect(memoryApi.candidates.accept).not.toHaveBeenCalled();
    await waitFor(() => expect(onResolved).toHaveBeenCalled());
  });

  it('"Not now" dismisses the suggestion via the tracking endpoint and resolves even if that call fails', async () => {
    (companionMemoryApi.dismissSuggestion as jest.Mock).mockRejectedValue(new Error('network'));
    const onResolved = jest.fn();
    const user = userEvent.setup();

    renderWithQuery(
      <MemorySuggestionCard suggestion={suggestion} sourceConversationId="conv-1" sourceMessageId="msg-1" onResolved={onResolved} />,
    );

    await user.click(screen.getByRole('button', { name: 'Not now' }));

    expect(companionMemoryApi.dismissSuggestion).toHaveBeenCalledWith('GOAL');
    await waitFor(() => expect(onResolved).toHaveBeenCalled());
  });

  it('"Never remember this type" updates consent to DENY_TYPE through the existing consent API', async () => {
    (memoryApi.consents.updateType as jest.Mock).mockResolvedValue({});
    const onResolved = jest.fn();
    const user = userEvent.setup();

    renderWithQuery(
      <MemorySuggestionCard suggestion={suggestion} sourceConversationId="conv-1" sourceMessageId="msg-1" onResolved={onResolved} />,
    );

    await user.click(screen.getByRole('button', { name: 'Never remember this type' }));

    expect(memoryApi.consents.updateType).toHaveBeenCalledWith('GOAL', 'DENY_TYPE');
    await waitFor(() => expect(onResolved).toHaveBeenCalled());
  });
});
