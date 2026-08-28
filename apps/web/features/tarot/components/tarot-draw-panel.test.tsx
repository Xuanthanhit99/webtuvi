import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { TarotReadingDto } from '@beaconvie/types';
import { renderWithQuery } from '@/test/render-with-query';
import { ApiError } from '@/lib/api-error';
import { TarotDrawPanel } from './tarot-draw-panel';
import { tarotApi } from '../api/tarot-api';

jest.mock('../api/tarot-api', () => ({
  tarotApi: { draw: jest.fn(), getReading: jest.fn() },
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
        nameVi: 'Kẻ Khờ',
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
        reflectionPrompts: ['What would you try if you trusted yourself a little more?', 'Where are you waiting for certainty that may not come?'],
        loveMeaning: 'A new connection worth approaching openly.',
        careerMeaning: 'A fresh direction worth meeting with curiosity.',
        financeMeaning: 'A first step worth a basic plan before leaping.',
        selfMeaning: 'An invitation to trust your own instincts.',
        deckVersion: 'tarot-v1-78',
      },
    },
  ],
  createdAt: '2026-01-05T00:00:00.000Z',
  updatedAt: '2026-01-05T00:00:00.000Z',
  archivedAt: null,
};

describe('TarotDrawPanel', () => {
  beforeEach(() => jest.clearAllMocks());

  async function goToSpreadStep(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByRole('button', { name: /Bắt đầu trải bài/ }));
    await user.click(screen.getByRole('button', { name: /Tiếp tục/ }));
  }

  it('defaults to Daily Draw and hides the question field', () => {
    renderWithQuery(<TarotDrawPanel />);
    expect(screen.getByRole('button', { name: /Bắt đầu trải bài/ })).toBeInTheDocument();
    expect(screen.queryByLabelText(/Câu hỏi của bạn/i)).not.toBeInTheDocument();
  });

  it('shows the optional question field during the intention step', async () => {
    const user = userEvent.setup();
    renderWithQuery(<TarotDrawPanel />);
    await user.click(screen.getByRole('button', { name: /Bắt đầu trải bài/ }));
    await user.click(screen.getByRole('button', { name: /Tiếp tục/ }));
    expect(screen.getByLabelText(/Câu hỏi của bạn/i)).toBeInTheDocument();
  });

  it('draws server-side, then reveals only after the user selects the face-down slot', async () => {
    let resolveDraw!: (reading: TarotReadingDto) => void;
    (tarotApi.draw as jest.Mock).mockReturnValue(new Promise((resolve) => { resolveDraw = resolve; }));
    const onDrawn = jest.fn();
    const user = userEvent.setup();
    renderWithQuery(<TarotDrawPanel onDrawn={onDrawn} />);

    await goToSpreadStep(user);
    await user.click(screen.getByRole('button', { name: /Tập trung và xáo bài/ }));
    expect(screen.getByRole('status')).toHaveTextContent('Hãy tập trung');
    expect(screen.queryByText('The Fool')).not.toBeInTheDocument();

    resolveDraw(drawnReading);
    expect(await screen.findByRole('button', { name: 'Chọn lá 1' }, { timeout: 3000 })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Chọn lá 1' }));
    const artwork = await screen.findByTestId('tarot-card-artwork', {}, { timeout: 3000 });
    fireEvent.error(artwork);
    await waitFor(() => expect(screen.getAllByText('The Fool').length).toBeGreaterThan(0), { timeout: 3000 });
    expect(tarotApi.draw).toHaveBeenCalledWith('DAILY_DRAW', undefined);
    expect(onDrawn).toHaveBeenCalledWith(drawnReading);
  });

  it('a PREMIUM_REQUIRED draw error shows an upgrade banner with a link to /premium, not just a toast', async () => {
    (tarotApi.draw as jest.Mock).mockRejectedValue(
      new ApiError("You've reached today's free single card limit (3). Upgrade to Premium for a higher daily allowance.", 'PREMIUM_REQUIRED', 403),
    );
    const user = userEvent.setup();
    renderWithQuery(<TarotDrawPanel />);
    await user.click(screen.getByRole('button', { name: /Bắt đầu trải bài/ }));
    await user.click(screen.getByRole('button', { name: /Single Card/ }));
    await user.click(screen.getByRole('button', { name: /Tiếp tục/ }));
    await user.click(screen.getByRole('button', { name: /Tập trung và xáo bài/ }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/free single card limit/i);
    const upgradeLink = screen.getByRole('link', { name: 'Upgrade to Premium' });
    expect(upgradeLink).toHaveAttribute('href', '/premium?reason=required');
  });

  it('a TAROT_DAILY_LIMIT_REACHED error (Premium ceiling also hit) shows the limit message without an upgrade link', async () => {
    (tarotApi.draw as jest.Mock).mockRejectedValue(
      new ApiError("You've reached today's single card limit (15). Come back tomorrow.", 'TAROT_DAILY_LIMIT_REACHED', 400),
    );
    const user = userEvent.setup();
    renderWithQuery(<TarotDrawPanel />);
    await user.click(screen.getByRole('button', { name: /Bắt đầu trải bài/ }));
    await user.click(screen.getByRole('button', { name: /Single Card/ }));
    await user.click(screen.getByRole('button', { name: /Tiếp tục/ }));
    await user.click(screen.getByRole('button', { name: /Tập trung và xáo bài/ }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/single card limit \(15\)/i);
    expect(screen.queryByRole('link', { name: 'Upgrade to Premium' })).not.toBeInTheDocument();
  });

  it('"Rút trải bài khác" resets back to the landing', async () => {
    (tarotApi.draw as jest.Mock).mockResolvedValue(drawnReading);
    const user = userEvent.setup();
    renderWithQuery(<TarotDrawPanel />);
    await goToSpreadStep(user);
    await user.click(screen.getByRole('button', { name: /Tập trung và xáo bài/ }));
    await user.click(await screen.findByRole('button', { name: 'Chọn lá 1' }, { timeout: 3000 }));
    const artwork = await screen.findByTestId('tarot-card-artwork', {}, { timeout: 3000 });
    fireEvent.error(artwork);
    await waitFor(() => expect(screen.getAllByText('The Fool').length).toBeGreaterThan(0), { timeout: 3000 });

    // The reveal-flip ritual runs for a short real interval before "Rút trải bài khác" appears
    // (TarotReadingView only renders once the reveal sequence's `revealStage` reaches 'done') —
    // findByRole already polls, so just give it enough time to finish.
    await user.click(await screen.findByRole('button', { name: 'Rút trải bài khác' }, { timeout: 3000 }));
    expect(screen.getByRole('button', { name: /Bắt đầu trải bài/ })).toBeInTheDocument();
    expect(screen.queryByText('The Fool')).not.toBeInTheDocument();
  });

  it('skipping the shuffle ritual reaches selection quickly without a second draw call', async () => {
    (tarotApi.draw as jest.Mock).mockResolvedValue(drawnReading);
    const user = userEvent.setup();
    renderWithQuery(<TarotDrawPanel />);
    await goToSpreadStep(user);
    await user.click(screen.getByRole('button', { name: /Tập trung và xáo bài/ }));

    await user.click(await screen.findByRole('button', { name: 'Bỏ qua' }));
    expect(await screen.findByRole('button', { name: 'Chọn lá 1' }, { timeout: 3000 })).toBeInTheDocument();
    expect(tarotApi.draw).toHaveBeenCalledTimes(1);
  });

  it('under prefers-reduced-motion, the same real result still hands off through onDrawn', async () => {
    const matchMediaSpy = jest.spyOn(window, 'matchMedia').mockImplementation((query: string) => ({
      matches: query.includes('reduce'),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList);

    try {
      (tarotApi.draw as jest.Mock).mockResolvedValue(drawnReading);
      const onDrawn = jest.fn();
      const user = userEvent.setup();
      renderWithQuery(<TarotDrawPanel onDrawn={onDrawn} />);
      await goToSpreadStep(user);
      await user.click(screen.getByRole('button', { name: /Tập trung và xáo bài/ }));
      await user.click(await screen.findByRole('button', { name: 'Chọn lá 1' }, { timeout: 3000 }));
      await waitFor(() => expect(onDrawn).toHaveBeenCalledWith(drawnReading));
      expect(await screen.findByRole('button', { name: 'Rút trải bài khác' }, { timeout: 3000 })).toBeInTheDocument();
    } finally {
      matchMediaSpy.mockRestore();
    }
  });
});
