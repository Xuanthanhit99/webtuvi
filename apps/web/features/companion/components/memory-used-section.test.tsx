import { screen, fireEvent } from '@testing-library/react';
import { renderWithQuery } from '@/test/render-with-query';
import { MemoryUsedSection } from './memory-used-section';
import type { MemoryReferenceDto } from '@beaconvie/types';

jest.mock('@/features/memory/api/memory-api', () => ({
  memoryApi: { get: jest.fn(() => new Promise(() => {})) }, // never resolves — MemoryCard just stays loading, harmless
}));

function reference(memoryId: string, title: string): MemoryReferenceDto {
  return {
    memoryId,
    title,
    type: 'PREFERENCE',
    reason: 'test',
    retrievalType: 'CONTEXT_MATCH',
    importance: { score: 0.5, explanations: [] },
    retrievalTimestamp: '2026-08-19T09:00:00.000Z',
    sourceConversationId: null,
    createdAt: '2026-08-19T09:00:00.000Z',
  };
}

describe('MemoryUsedSection — "Why I remembered this" accessible names', () => {
  it('gives multiple used-memory items in the same message distinguishable accessible names', async () => {
    renderWithQuery(
      <MemoryUsedSection
        conversationId="c1"
        messageId="m1"
        used={[reference('mem-1', 'First memory'), reference('mem-2', 'Second memory'), reference('mem-3', 'Third memory')]}
      />,
    );

    fireEvent.click(await screen.findByRole('button', { name: /show memory used \(3\)/i }));

    const buttons = screen.getAllByRole('button', { name: /why i remembered this/i });
    expect(buttons).toHaveLength(3);

    const names = buttons.map((b) => b.getAttribute('aria-label'));
    expect(new Set(names).size).toBe(3);
    expect(names).toEqual([
      'Why I remembered this (1 of 3)',
      'Why I remembered this (2 of 3)',
      'Why I remembered this (3 of 3)',
    ]);
  });

  it('does not add a numeric suffix when only one memory was used', async () => {
    renderWithQuery(<MemoryUsedSection conversationId="c1" messageId="m1" used={[reference('mem-1', 'Only memory')]} />);

    fireEvent.click(await screen.findByRole('button', { name: /show memory used \(1\)/i }));

    expect(screen.getByRole('button', { name: 'Why I remembered this' })).toBeInTheDocument();
  });
});
