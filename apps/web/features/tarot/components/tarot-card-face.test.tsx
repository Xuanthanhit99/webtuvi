import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { TarotCardDto } from '@beaconvie/types';
import { TarotCardFace, TarotCardVisual } from './tarot-card-face';

const card: TarotCardDto = {
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
  reversedMeaning: 'Naivety, risk taken too far.',
  element: 'Air',
  astrological: 'Uranus',
  categories: ['new-beginnings'],
  imageSlug: 'major-00-the-fool',
  reflectionPrompts: ['What would you try if you trusted yourself a little more?', 'Where are you waiting for certainty that may not come?'],
  loveMeaning: 'A new connection worth approaching openly.',
  careerMeaning: 'A fresh direction worth meeting with curiosity.',
  financeMeaning: 'A first step worth a basic plan before leaping.',
  selfMeaning: 'An invitation to trust your own instincts.',
  deckVersion: 'tarot-v1-78',
};

describe('TarotCardFace', () => {
  it('renders the real card name and number — never a placeholder', () => {
    render(<TarotCardFace card={card} isReversed={false} />);
    expect(screen.getByText('The Fool')).toBeInTheDocument();
    expect(screen.getByText('00')).toBeInTheDocument();
  });

  it('the whole card flips upside-down when reversed, including its name', () => {
    render(<TarotCardFace card={card} isReversed />);
    const button = screen.getByRole('button', { name: 'The Fool, reversed' });
    expect(button.className).toContain('rotate-180');
  });

  it('is not rotated when upright', () => {
    render(<TarotCardFace card={card} isReversed={false} />);
    const button = screen.getByRole('button', { name: 'The Fool' });
    expect(button.className).not.toContain('rotate-180');
  });

  it('calls onClick when pressed', async () => {
    const onClick = jest.fn();
    const user = userEvent.setup();
    render(<TarotCardFace card={card} isReversed={false} onClick={onClick} />);
    await user.click(screen.getByRole('button', { name: 'The Fool' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('falls back to the canonical face if future artwork fails to load', () => {
    render(<TarotCardFace card={card} isReversed={false} imageSrc="/missing-tarot.webp" />);
    fireEvent.error(screen.getByTestId('tarot-card-artwork'));
    expect(screen.getByText('The Fool')).toBeInTheDocument();
    expect(screen.getByText('00')).toBeInTheDocument();
  });
});

describe('TarotCardVisual — face-down / card-back rendering', () => {
  it('renders the symbolic placeholder when face-down and no backImageSrc is given (unchanged prior behavior)', () => {
    render(<TarotCardVisual id="preview-1" name="Daily Draw" revealed={false} />);
    expect(screen.queryByTestId('tarot-card-back-artwork')).not.toBeInTheDocument();
    expect(screen.queryByTestId('tarot-card-artwork')).not.toBeInTheDocument();
  });

  it('renders the real card-back image when face-down and backImageSrc is given', () => {
    render(<TarotCardVisual id="preview-2" name="Daily Draw" revealed={false} backImageSrc="/assets/tarot/card-back.webp" />);
    expect(screen.getByTestId('tarot-card-back-artwork')).toHaveAttribute('src', '/assets/tarot/card-back.webp');
  });

  it('falls back to the symbolic placeholder if the card-back image fails to load', () => {
    render(<TarotCardVisual id="preview-3" name="Daily Draw" revealed={false} backImageSrc="/missing-back.webp" />);
    fireEvent.error(screen.getByTestId('tarot-card-back-artwork'));
    expect(screen.queryByTestId('tarot-card-back-artwork')).not.toBeInTheDocument();
  });

  it('never shows the card-back image for a revealed (face-up) card, even if backImageSrc is passed', () => {
    render(<TarotCardVisual id="preview-4" name="The Fool" revealed backImageSrc="/assets/tarot/card-back.webp" />);
    expect(screen.queryByTestId('tarot-card-back-artwork')).not.toBeInTheDocument();
  });
});
