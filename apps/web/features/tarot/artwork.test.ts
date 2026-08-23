import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { resolveTarotArtworkSrc, TAROT_CARD_BACK_SRC } from './artwork';

const PUBLIC_ROOT = join(__dirname, '../../public');

function toDiskPath(publicPath: string): string {
  return join(PUBLIC_ROOT, publicPath.replace(/^\//, ''));
}

/** Tarot 78-Card Artwork Production pass — proves the resolver's manifest is internally
 * consistent (Major/Minor path format, unique output per card) and that the two founder-approved,
 * already-supplied assets are genuinely present on disk — never asserts a PENDING file exists. */
describe('Tarot artwork manifest', () => {
  it('resolves a Major Arcana card under /assets/tarot/cards/major/', () => {
    const src = resolveTarotArtworkSrc({ arcana: 'MAJOR', suit: null, imageSlug: 'major-17-the-star' });
    expect(src).toBe('/assets/tarot/cards/major/major-17-the-star.webp');
  });

  it('resolves a Minor Arcana card under /assets/tarot/cards/minor/{suit}/', () => {
    expect(resolveTarotArtworkSrc({ arcana: 'MINOR', suit: 'WANDS', imageSlug: 'wands-01-ace-of-wands' })).toBe(
      '/assets/tarot/cards/minor/wands/wands-01-ace-of-wands.webp',
    );
    expect(resolveTarotArtworkSrc({ arcana: 'MINOR', suit: 'CUPS', imageSlug: 'cups-05-five-of-cups' })).toBe(
      '/assets/tarot/cards/minor/cups/cups-05-five-of-cups.webp',
    );
    expect(resolveTarotArtworkSrc({ arcana: 'MINOR', suit: 'SWORDS', imageSlug: 'swords-14-king-of-swords' })).toBe(
      '/assets/tarot/cards/minor/swords/swords-14-king-of-swords.webp',
    );
    expect(resolveTarotArtworkSrc({ arcana: 'MINOR', suit: 'PENTACLES', imageSlug: 'pentacles-11-page-of-pentacles' })).toBe(
      '/assets/tarot/cards/minor/pentacles/pentacles-11-page-of-pentacles.webp',
    );
  });

  it('produces a unique path per unique imageSlug (no two cards can collide)', () => {
    const cards = [
      { arcana: 'MAJOR' as const, suit: null, imageSlug: 'major-00-the-fool' },
      { arcana: 'MAJOR' as const, suit: null, imageSlug: 'major-17-the-star' },
      { arcana: 'MINOR' as const, suit: 'WANDS' as const, imageSlug: 'wands-01-ace-of-wands' },
      { arcana: 'MINOR' as const, suit: 'CUPS' as const, imageSlug: 'wands-01-ace-of-wands' }, // same imageSlug, different suit folder
    ];
    const paths = cards.map(resolveTarotArtworkSrc);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('the approved The Star artwork physically exists at its resolved path', () => {
    const src = resolveTarotArtworkSrc({ arcana: 'MAJOR', suit: null, imageSlug: 'major-17-the-star' });
    expect(existsSync(toDiskPath(src))).toBe(true);
  });

  it('a not-yet-supplied card (e.g. The Fool) does not exist on disk yet — never assumed READY', () => {
    const src = resolveTarotArtworkSrc({ arcana: 'MAJOR', suit: null, imageSlug: 'major-00-the-fool' });
    expect(existsSync(toDiskPath(src))).toBe(false);
  });

  it('the shared card back resolves to one fixed path and physically exists', () => {
    expect(TAROT_CARD_BACK_SRC).toBe('/assets/tarot/card-back.webp');
    expect(existsSync(toDiskPath(TAROT_CARD_BACK_SRC))).toBe(true);
  });
});
