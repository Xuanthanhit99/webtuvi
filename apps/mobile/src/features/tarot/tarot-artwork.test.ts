import { tarotArtworkUri, TAROT_BACK_URI } from './tarot-artwork';

describe('Tarot canonical artwork', () => {
  it('resolves the approved back artwork', () => {
    expect(TAROT_BACK_URI).toBe('https://tuvitarot.vn/assets/tarot/card-back.webp');
  });
  it('resolves Major Arcana with the web canonical filename', () => {
    expect(tarotArtworkUri({ arcana: 'MAJOR', imageSlug: 'major-17-the-star' })).toBe('https://tuvitarot.vn/assets/tarot-card/17-the-star.webp');
  });
  it('resolves all four Minor Arcana suits and court cards', () => {
    for (const suit of ['WANDS', 'CUPS', 'SWORDS', 'PENTACLES']) {
      expect(tarotArtworkUri({ arcana: 'MINOR', suit, number: 1 })).toBe(`https://tuvitarot.vn/assets/tarot-card/${suit.toLowerCase()}-ace.webp`);
      expect(tarotArtworkUri({ arcana: 'MINOR', suit, number: 14 })).toBe(`https://tuvitarot.vn/assets/tarot-card/${suit.toLowerCase()}-king.webp`);
    }
  });
  it('does not construct arbitrary external artwork URLs', () => {
    expect(tarotArtworkUri({ arcana: 'MAJOR', imageSlug: '../secrets' })).toBeNull();
    expect(tarotArtworkUri({ arcana: 'MINOR', suit: 'UNKNOWN', number: 5 })).toBeNull();
  });
});
