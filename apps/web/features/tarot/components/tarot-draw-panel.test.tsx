import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { TarotReadingDto } from '@beaconvie/types';
import { renderWithQuery } from '@/test/render-with-query';
import { TarotDrawPanel } from './tarot-draw-panel';
import { tarotApi } from '../api/tarot-api';

jest.mock('../api/tarot-api', () => ({
  tarotApi: { draw: jest.fn() },
}));

const drawnReading: TarotReadingDto = {
  id: 'r1',
  type: 'DAILY_DRAW',
  status: 'ACTIVE',
  visibility: 'COMPANION_VISIBLE',
  spreadSlug: 'daily-draw',
  spreadName: 'Today',
  question: null,
  interpretation: 'A moment worth sitting with.',
  cards: [
    {
      position: 0,
      positionLabel: 'Today',
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

describe('TarotDrawPanel', () => {
  beforeEach(() => jest.clearAllMocks());

  it('defaults to Daily Draw and hides the question field', () => {
    renderWithQuery(<TarotDrawPanel />);
    expect(screen.queryByLabelText(/your question/i)).not.toBeInTheDocument();
  });

  it('shows the question field once a non-Daily-Draw type is selected', async () => {
    const user = userEvent.setup();
    renderWithQuery(<TarotDrawPanel />);
    await user.click(screen.getByRole('button', { name: /Single Card/ }));
    expect(screen.getByLabelText(/your question/i)).toBeInTheDocument();
  });

  it('drawing reveals the real, already-computed result — no fabricated card while shuffling', async () => {
    let resolveDraw!: (reading: TarotReadingDto) => void;
    (tarotApi.draw as jest.Mock).mockReturnValue(new Promise((resolve) => { resolveDraw = resolve; }));
    const onDrawn = jest.fn();
    const user = userEvent.setup();
    renderWithQuery(<TarotDrawPanel onDrawn={onDrawn} />);

    await user.click(screen.getByRole('button', { name: 'Draw' }));
    expect(screen.getByRole('status')).toHaveTextContent('Shuffling…');
    expect(screen.queryByText('The Fool')).not.toBeInTheDocument();

    resolveDraw(drawnReading);
    await waitFor(() => expect(screen.getByText('The Fool')).toBeInTheDocument(), { timeout: 3000 });
    expect(tarotApi.draw).toHaveBeenCalledWith('DAILY_DRAW', undefined);
    expect(onDrawn).toHaveBeenCalledWith(drawnReading);
  });

  it('"Draw again" resets back to the selector', async () => {
    (tarotApi.draw as jest.Mock).mockResolvedValue(drawnReading);
    const user = userEvent.setup();
    renderWithQuery(<TarotDrawPanel />);
    await user.click(screen.getByRole('button', { name: 'Draw' }));
    await waitFor(() => expect(screen.getByText('The Fool')).toBeInTheDocument(), { timeout: 3000 });

    await user.click(screen.getByRole('button', { name: 'Draw again' }));
    expect(screen.getByRole('button', { name: 'Draw' })).toBeInTheDocument();
    expect(screen.queryByText('The Fool')).not.toBeInTheDocument();
  });
});
