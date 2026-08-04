import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithQuery } from '@/test/render-with-query';
import { ForgetSuggestionCard } from './forget-suggestion-card';
import { companionMemoryApi } from '../api/companion-memory-api';

jest.mock('../api/companion-memory-api', () => ({
  companionMemoryApi: {
    confirmDelete: jest.fn(),
    confirmNeverRemember: jest.fn(),
  },
}));

describe('ForgetSuggestionCard', () => {
  beforeEach(() => jest.clearAllMocks());

  it('never deletes anything just by rendering — nothing is called until the user confirms', () => {
    renderWithQuery(
      <ForgetSuggestionCard
        suggestion={{ kind: 'FORGET_RECENT', message: 'Forget that?', candidates: [{ memoryId: 'mem-1', title: 'Old job', summary: 's', type: 'GOAL' }], type: null }}
        onResolved={jest.fn()}
      />,
    );
    expect(companionMemoryApi.confirmDelete).not.toHaveBeenCalled();
    expect(companionMemoryApi.confirmNeverRemember).not.toHaveBeenCalled();
  });

  it('confirming a single-candidate forget calls confirmDelete with that memory id and resolves', async () => {
    (companionMemoryApi.confirmDelete as jest.Mock).mockResolvedValue(undefined);
    const onResolved = jest.fn();
    const user = userEvent.setup();

    renderWithQuery(
      <ForgetSuggestionCard
        suggestion={{ kind: 'FORGET_RECENT', message: 'Forget that?', candidates: [{ memoryId: 'mem-1', title: 'Old job', summary: 's', type: 'GOAL' }], type: null }}
        onResolved={onResolved}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Yes, forget' }));

    expect(companionMemoryApi.confirmDelete).toHaveBeenCalledWith(['mem-1']);
    await waitFor(() => expect(onResolved).toHaveBeenCalled());
  });

  it('never maps an ambiguous forget (multiple candidates) to a silent single deletion — all listed candidates are sent', async () => {
    (companionMemoryApi.confirmDelete as jest.Mock).mockResolvedValue(undefined);
    const user = userEvent.setup();

    renderWithQuery(
      <ForgetSuggestionCard
        suggestion={{
          kind: 'DELETE_ABOUT',
          message: 'I found a couple of memories that might match — forget all of these?',
          candidates: [
            { memoryId: 'mem-1', title: 'Old job', summary: 's', type: 'GOAL' },
            { memoryId: 'mem-2', title: 'Older job', summary: 's', type: 'GOAL' },
          ],
          type: null,
        }}
        onResolved={jest.fn()}
      />,
    );

    expect(screen.getByText('Old job')).toBeInTheDocument();
    expect(screen.getByText('Older job')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Yes, forget' }));
    expect(companionMemoryApi.confirmDelete).toHaveBeenCalledWith(['mem-1', 'mem-2']);
  });

  it('a NEVER_REMEMBER_TYPE suggestion confirms through the consent API, not deletion', async () => {
    (companionMemoryApi.confirmNeverRemember as jest.Mock).mockResolvedValue(undefined);
    const onResolved = jest.fn();
    const user = userEvent.setup();

    renderWithQuery(
      <ForgetSuggestionCard
        suggestion={{ kind: 'NEVER_REMEMBER_TYPE', message: "Never remember goals?", candidates: [], type: 'GOAL' }}
        onResolved={onResolved}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Yes, forget' }));

    expect(companionMemoryApi.confirmNeverRemember).toHaveBeenCalledWith('GOAL');
    expect(companionMemoryApi.confirmDelete).not.toHaveBeenCalled();
    await waitFor(() => expect(onResolved).toHaveBeenCalled());
  });

  it('Cancel resolves without calling any Memory API', async () => {
    const onResolved = jest.fn();
    const user = userEvent.setup();

    renderWithQuery(
      <ForgetSuggestionCard
        suggestion={{ kind: 'FORGET_RECENT', message: 'Forget that?', candidates: [{ memoryId: 'mem-1', title: 'Old job', summary: 's', type: 'GOAL' }], type: null }}
        onResolved={onResolved}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onResolved).toHaveBeenCalled();
    expect(companionMemoryApi.confirmDelete).not.toHaveBeenCalled();
  });

  it('shows an "Okay" acknowledgement, with no destructive action available, when there is nothing to act on', () => {
    renderWithQuery(
      <ForgetSuggestionCard
        suggestion={{ kind: 'FORGET_RECENT', message: "I couldn't find a specific memory matching that.", candidates: [], type: null }}
        onResolved={jest.fn()}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Yes, forget' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Okay' })).toBeInTheDocument();
  });
});
