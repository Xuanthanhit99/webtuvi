import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ListReadingsResultDto, TarotReadingDto } from '@beaconvie/types';
import { renderWithQuery } from '@/test/render-with-query';
import { TarotDashboard } from './tarot-dashboard';
import { tarotApi } from '../api/tarot-api';

const mockReplace = jest.fn();
let mockSearchParamsValue = '';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => new URLSearchParams(mockSearchParamsValue),
}));

jest.mock('../api/tarot-api', () => ({
  tarotApi: {
    listReadings: jest.fn(),
    getReading: jest.fn(),
    draw: jest.fn(),
  },
}));

const reading: TarotReadingDto = {
  id: 'r1',
  type: 'SINGLE_CARD',
  status: 'ACTIVE',
  visibility: 'COMPANION_VISIBLE',
  spreadSlug: 'single-card',
  spreadName: 'Single Card',
  question: 'What should I focus on?',
  interpretation: 'A moment worth sitting with.',
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

const listResult: ListReadingsResultDto = { items: [reading], total: 1, page: 1, pageSize: 20 };

describe('TarotDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParamsValue = '';
  });

  it('renders the draw panel and real reading history by default', async () => {
    (tarotApi.listReadings as jest.Mock).mockResolvedValue(listResult);
    renderWithQuery(<TarotDashboard />);
    expect(screen.getByRole('heading', { name: 'Một nghi thức nhỏ để nhìn rõ điều đang băn khoăn' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Draw' })).toBeInTheDocument();
    expect(await screen.findByText('The Fool')).toBeInTheDocument();
  });

  it('shows an empty state when there is no history yet', async () => {
    (tarotApi.listReadings as jest.Mock).mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 });
    renderWithQuery(<TarotDashboard />);
    expect(await screen.findByText('No readings yet')).toBeInTheDocument();
  });

  it('opening ?item=<id> renders the real reading detail instead of the draw/history view', async () => {
    mockSearchParamsValue = 'item=r1';
    (tarotApi.getReading as jest.Mock).mockResolvedValue(reading);
    renderWithQuery(<TarotDashboard />);

    expect(await screen.findByText('A moment worth sitting with.')).toBeInTheDocument();
    expect(tarotApi.getReading).toHaveBeenCalledWith('r1');
    expect(screen.queryByRole('button', { name: 'Draw' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '← Back to Tarot' })).toBeInTheDocument();
  });

  it('closing the detail view navigates back to the plain /discover/tarot route', async () => {
    mockSearchParamsValue = 'item=r1';
    (tarotApi.getReading as jest.Mock).mockResolvedValue(reading);
    const user = userEvent.setup();
    renderWithQuery(<TarotDashboard />);

    await screen.findByText('A moment worth sitting with.');
    await user.click(screen.getByRole('button', { name: '← Back to Tarot' }));
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/discover/tarot', { scroll: false }));
  });
});
