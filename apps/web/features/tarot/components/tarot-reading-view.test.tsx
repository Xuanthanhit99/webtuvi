import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { TarotReadingDto } from '@beaconvie/types';
import { renderWithQuery } from '@/test/render-with-query';
import { TarotReadingView } from './tarot-reading-view';
import { tarotApi } from '../api/tarot-api';

jest.mock('../api/tarot-api', () => ({
  tarotApi: {
    retryInterpretation: jest.fn(),
    archiveReading: jest.fn(),
    restoreReading: jest.fn(),
    deleteReading: jest.fn(),
  },
}));

const baseReading: TarotReadingDto = {
  id: 'r1',
  type: 'SINGLE_CARD',
  status: 'ACTIVE',
  visibility: 'COMPANION_VISIBLE',
  spreadSlug: 'single-card',
  spreadName: 'Single Card',
  question: 'What should I focus on?',
  interpretation: 'A moment worth sitting with — what feels most alive for you right now?',
  cards: [
    {
      position: 0,
      positionLabel: 'Focus',
      isReversed: false,
      card: {
        id: 'c1',
        slug: 'major-00-the-fool',
        name: 'The Fool',
        arcana: 'MAJOR',
        suit: null,
        number: 0,
        uprightKeywords: ['beginnings'],
        uprightMeaning: 'A leap of faith.',
        reversedKeywords: ['recklessness'],
        reversedMeaning: 'Naivety.',
        element: 'Air',
        astrological: 'Uranus',
        categories: [],
        imageSlug: 'major-00-the-fool',
      },
    },
  ],
  createdAt: '2026-01-05T00:00:00.000Z',
  updatedAt: '2026-01-05T00:00:00.000Z',
  archivedAt: null,
};

describe('TarotReadingView', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders the real drawn card, the question, and the generated interpretation', () => {
    renderWithQuery(<TarotReadingView reading={baseReading} />);
    expect(screen.getByText('The Fool')).toBeInTheDocument();
    expect(screen.getByText('“What should I focus on?”')).toBeInTheDocument();
    expect(screen.getByText(baseReading.interpretation!)).toBeInTheDocument();
    expect(screen.getByText('Focus')).toBeInTheDocument();
  });

  it('labels the interpretation as AI, distinct from the deterministic card above it', () => {
    renderWithQuery(<TarotReadingView reading={baseReading} />);
    expect(screen.getByText('AI Interpretation')).toBeInTheDocument();
  });

  it('shows a "Generate interpretation" retry action when interpretation is still null', async () => {
    (tarotApi.retryInterpretation as jest.Mock).mockResolvedValue({ ...baseReading, interpretation: 'Now generated.' });
    const user = userEvent.setup();
    renderWithQuery(<TarotReadingView reading={{ ...baseReading, interpretation: null }} />);
    expect(screen.getByText('Interpretation isn’t ready yet.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Generate interpretation' }));
    await waitFor(() => expect(tarotApi.retryInterpretation).toHaveBeenCalledWith('r1'));
  });

  it('an ACTIVE reading only offers Archive and Delete', () => {
    renderWithQuery(<TarotReadingView reading={baseReading} />);
    expect(screen.getByRole('button', { name: 'Archive' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Restore' })).not.toBeInTheDocument();
  });

  it('an ARCHIVED reading offers Restore and Delete, not Archive', () => {
    renderWithQuery(<TarotReadingView reading={{ ...baseReading, status: 'ARCHIVED' }} />);
    expect(screen.getByRole('button', { name: 'Restore' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Archive' })).not.toBeInTheDocument();
  });

  it('a DELETED reading only offers Restore', () => {
    renderWithQuery(<TarotReadingView reading={{ ...baseReading, status: 'DELETED' }} />);
    expect(screen.getByRole('button', { name: 'Restore' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Archive' })).not.toBeInTheDocument();
  });

  it('clicking Archive calls the real archive endpoint with this reading’s id', async () => {
    (tarotApi.archiveReading as jest.Mock).mockResolvedValue({ ...baseReading, status: 'ARCHIVED' });
    const user = userEvent.setup();
    renderWithQuery(<TarotReadingView reading={baseReading} />);
    await user.click(screen.getByRole('button', { name: 'Archive' }));
    await waitFor(() => expect(tarotApi.archiveReading).toHaveBeenCalledWith('r1'));
  });
});
