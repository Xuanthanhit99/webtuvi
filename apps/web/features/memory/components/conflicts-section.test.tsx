import { screen } from '@testing-library/react';
import { renderWithQuery } from '@/test/render-with-query';
import { ConflictsSection } from './conflicts-section';
import { memoryApi } from '../api/memory-api';

jest.mock('../api/memory-api', () => ({
  memoryApi: {
    intelligence: {
      conflicts: jest.fn(),
    },
  },
}));

describe('ConflictsSection', () => {
  it('shows an empty state when there are no conflicts', async () => {
    (memoryApi.intelligence.conflicts as jest.Mock).mockResolvedValue([]);

    renderWithQuery(<ConflictsSection />);

    expect(await screen.findByText('No conflicts found.')).toBeInTheDocument();
  });

  it('shows a detected conflict with its plain-language reason', async () => {
    (memoryApi.intelligence.conflicts as jest.Mock).mockResolvedValue([
      {
        id: 'conf-1',
        memoryAId: 'a',
        memoryBId: 'b',
        status: 'SUPERSEDED',
        reason: 'The newer memory ("moved to") appears to replace this earlier location preference memory.',
        detectedAt: '2026-01-01T00:00:00.000Z',
      },
    ]);

    renderWithQuery(<ConflictsSection />);

    expect(await screen.findByText(/appears to replace/i)).toBeInTheDocument();
    expect(screen.getByText('Likely replaced')).toBeInTheDocument();
  });
});
