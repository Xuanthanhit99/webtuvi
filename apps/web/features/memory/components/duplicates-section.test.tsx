import { screen } from '@testing-library/react';
import { renderWithQuery } from '@/test/render-with-query';
import { DuplicatesSection } from './duplicates-section';
import { memoryApi } from '../api/memory-api';

jest.mock('../api/memory-api', () => ({
  memoryApi: {
    intelligence: {
      duplicates: jest.fn(),
    },
  },
}));

describe('DuplicatesSection', () => {
  it('shows an empty state when there are no duplicates', async () => {
    (memoryApi.intelligence.duplicates as jest.Mock).mockResolvedValue([]);

    renderWithQuery(<DuplicatesSection />);

    expect(await screen.findByText('No duplicates found.')).toBeInTheDocument();
  });

  it('shows a detected duplicate pair with its match type and similarity', async () => {
    (memoryApi.intelligence.duplicates as jest.Mock).mockResolvedValue([
      {
        id: 'dup-1',
        memoryAId: 'a',
        memoryBId: 'b',
        matchType: 'NORMALIZED',
        similarity: 100,
        reason: 'These two memories say exactly the same thing.',
        status: 'PENDING',
        detectedAt: '2026-01-01T00:00:00.000Z',
      },
    ]);

    renderWithQuery(<DuplicatesSection />);

    expect(await screen.findByText('Same wording')).toBeInTheDocument();
    expect(screen.getByText('100% match')).toBeInTheDocument();
  });
});
