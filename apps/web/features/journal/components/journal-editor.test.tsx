import { screen } from '@testing-library/react';
import { renderWithQuery } from '@/test/render-with-query';
import { JournalEditor } from './journal-editor';
import { useJournalDraft } from '../hooks/use-journal-draft';
import type { JournalEntryDto } from '@beaconvie/types';

jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh: jest.fn() }) }));
jest.mock('../hooks/use-journal-draft');

const entry: JournalEntryDto = {
  id: 'e1',
  title: 'My entry',
  content: 'Some content',
  mood: null,
  tags: [],
  state: 'DRAFT',
  createdAt: '2026-08-19T09:00:00.000Z',
  updatedAt: '2026-08-19T09:00:00.000Z',
  publishedAt: null,
  archivedAt: null,
} as unknown as JournalEntryDto;

describe('JournalEditor — title field focus visibility', () => {
  it('does not suppress focus-visible on the title input — regression for the confirmed dropped focus ring', () => {
    (useJournalDraft as jest.Mock).mockReturnValue({
      title: 'My entry',
      content: 'Some content',
      mood: null,
      tags: [],
      setTitle: jest.fn(),
      setContent: jest.fn(),
      setMood: jest.fn(),
      setTags: jest.fn(),
      status: 'saved',
      lastSavedAt: null,
      saveNow: jest.fn(),
      recoverableBackup: null,
      applyRecoveredBackup: jest.fn(),
      discardRecoveredBackup: jest.fn(),
    });

    renderWithQuery(<JournalEditor entry={entry} />);

    const titleInput = screen.getByLabelText('Title');
    // Every other interactive control in the app applies the same focus-visible-insight-outline
    // convention (see input.tsx's own base classes); this control must inherit it, not override
    // it away — the regression was an explicit `focus-visible:outline-none` with no replacement.
    expect(titleInput.className).not.toContain('outline-none');
  });
});
