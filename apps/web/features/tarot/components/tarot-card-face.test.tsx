import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { TarotCardDto } from '@beaconvie/types';
import { TarotCardFace } from './tarot-card-face';

const card: TarotCardDto = {
  id: 'c1',
  slug: 'major-00-the-fool',
  name: 'The Fool',
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
