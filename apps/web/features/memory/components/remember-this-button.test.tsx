import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithQuery } from '@/test/render-with-query';
import { RememberThisButton } from './remember-this-button';
import { memoryApi } from '../api/memory-api';

jest.mock('../api/memory-api', () => ({
  memoryApi: {
    candidates: {
      propose: jest.fn(),
      accept: jest.fn(),
    },
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('RememberThisButton', () => {
  it('proposes then accepts a candidate sourced from this exact message', async () => {
    (memoryApi.candidates.propose as jest.Mock).mockResolvedValue({ id: 'cand-1', status: 'CANDIDATE' });
    (memoryApi.candidates.accept as jest.Mock).mockResolvedValue({ memory: { id: 'mem-1' }, candidate: {} });
    const user = userEvent.setup();

    renderWithQuery(<RememberThisButton conversationId="conv-1" messageId="msg-1" content="Starting a new job next week." />);
    await user.click(screen.getByRole('button', { name: /remember this/i }));
    const confirmButtons = screen.getAllByRole('button', { name: /remember this/i });
    await user.click(confirmButtons[confirmButtons.length - 1]!);

    await waitFor(() =>
      expect(memoryApi.candidates.propose).toHaveBeenCalledWith(
        expect.objectContaining({ sourceConversationId: 'conv-1', sourceMessageId: 'msg-1' }),
      ),
    );
    await waitFor(() => expect(memoryApi.candidates.accept).toHaveBeenCalledWith('cand-1'));
  });

  it('does not call accept() when consent blocks the candidate (PENDING_CONSENT)', async () => {
    (memoryApi.candidates.propose as jest.Mock).mockResolvedValue({ id: 'cand-1', status: 'PENDING_CONSENT' });
    const user = userEvent.setup();

    renderWithQuery(<RememberThisButton conversationId="conv-1" messageId="msg-1" content="Something health-related." />);
    await user.click(screen.getByRole('button', { name: /remember this/i }));
    const confirmButtons = screen.getAllByRole('button', { name: /remember this/i });
    await user.click(confirmButtons[confirmButtons.length - 1]!);

    await waitFor(() => expect(memoryApi.candidates.propose).toHaveBeenCalled());
    expect(memoryApi.candidates.accept).not.toHaveBeenCalled();
  });

  it('disables the confirm action when the summary is emptied out', async () => {
    const user = userEvent.setup();
    renderWithQuery(<RememberThisButton conversationId="conv-1" messageId="msg-1" content="Some content" />);
    await user.click(screen.getByRole('button', { name: /remember this/i }));

    const summaryField = screen.getByLabelText(/what should beaconvie remember/i);
    await user.clear(summaryField);

    const confirmButtons = screen.getAllByRole('button', { name: /remember this/i });
    expect(confirmButtons[confirmButtons.length - 1]).toBeDisabled();
  });
});
