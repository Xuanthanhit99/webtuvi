import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithQuery } from '@/test/render-with-query';
import { JournalSuggestionCard } from './journal-suggestion-card';
import { companionJournalApi } from '../api/companion-journal-api';

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }));

jest.mock('../api/companion-journal-api', () => ({
  companionJournalApi: {
    save: jest.fn(),
    neverAgain: jest.fn(),
  },
}));

const suggestion = { excerpt: 'Today was such an emotional day.', reason: 'This sounds like something worth keeping.' };

describe('JournalSuggestionCard', () => {
  beforeEach(() => jest.clearAllMocks());

  it('never saves anything just by rendering', () => {
    renderWithQuery(
      <JournalSuggestionCard suggestion={suggestion} sourceConversationId="conv-1" sourceMessageId="msg-1" onResolved={jest.fn()} />,
    );
    expect(companionJournalApi.save).not.toHaveBeenCalled();
    expect(companionJournalApi.neverAgain).not.toHaveBeenCalled();
  });

  it('shows the real excerpt of what the user said, not fabricated content', () => {
    renderWithQuery(
      <JournalSuggestionCard suggestion={suggestion} sourceConversationId="conv-1" sourceMessageId="msg-1" onResolved={jest.fn()} />,
    );
    expect(screen.getByText(/today was such an emotional day/i)).toBeInTheDocument();
  });

  it('"Save as Journal" creates a draft via the source message and navigates to it', async () => {
    (companionJournalApi.save as jest.Mock).mockResolvedValue({ id: 'j-1', state: 'DRAFT' });
    const onResolved = jest.fn();
    const user = userEvent.setup();

    renderWithQuery(
      <JournalSuggestionCard suggestion={suggestion} sourceConversationId="conv-1" sourceMessageId="msg-1" onResolved={onResolved} />,
    );

    await user.click(screen.getByRole('button', { name: 'Save as Journal' }));

    await waitFor(() => expect(companionJournalApi.save).toHaveBeenCalledWith('conv-1', 'msg-1'));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/journal/j-1'));
    expect(onResolved).toHaveBeenCalled();
  });

  it('"Later" resolves without calling any API', async () => {
    const onResolved = jest.fn();
    const user = userEvent.setup();
    renderWithQuery(
      <JournalSuggestionCard suggestion={suggestion} sourceConversationId="conv-1" sourceMessageId="msg-1" onResolved={onResolved} />,
    );
    await user.click(screen.getByRole('button', { name: 'Later' }));
    expect(onResolved).toHaveBeenCalled();
    expect(companionJournalApi.save).not.toHaveBeenCalled();
    expect(companionJournalApi.neverAgain).not.toHaveBeenCalled();
  });

  it('"Never suggest again" disables future suggestions and resolves even on failure', async () => {
    (companionJournalApi.neverAgain as jest.Mock).mockRejectedValue(new Error('network'));
    const onResolved = jest.fn();
    const user = userEvent.setup();
    renderWithQuery(
      <JournalSuggestionCard suggestion={suggestion} sourceConversationId="conv-1" sourceMessageId="msg-1" onResolved={onResolved} />,
    );
    await user.click(screen.getByRole('button', { name: 'Never suggest again' }));
    expect(companionJournalApi.neverAgain).toHaveBeenCalled();
    await waitFor(() => expect(onResolved).toHaveBeenCalled());
  });
});
