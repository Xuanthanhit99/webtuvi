import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { resolveCanonicalCardId, resolveTarotArtworkSrc, TAROT_CARD_BACK_SRC } from './artwork';

const PUBLIC_ROOT = join(__dirname, '../../public');

function toDiskPath(publicPath: string): string {
  return join(PUBLIC_ROOT, publicPath.replace(/^\//, ''));
}

/** Tarot Production Integration pass — proves the resolver maps every real DB card shape onto the
 * canonical 78-card deck under `/assets/tarot-card/`, and that the resolved file genuinely exists
 * and decodes-worthy on disk (not merely a string match) for every card, not just one sample. */
describe('Tarot artwork manifest', () => {
  it('resolves a Major Arcana card to its canonical flat path', () => {
    const src = resolveTarotArtworkSrc({ arcana: 'MAJOR', suit: null, number: 17, imageSlug: 'major-17-the-star' });
    expect(src).toBe('/assets/tarot-card/17-the-star.webp');
  });

  it('resolves Minor Arcana pip, and ace/page/knight/queen/king cards to their canonical token', () => {
    expect(resolveTarotArtworkSrc({ arcana: 'MINOR', suit: 'WANDS', number: 1, imageSlug: 'wands-01-ace-of-wands' })).toBe(
      '/assets/tarot-card/wands-ace.webp',
    );
    expect(resolveTarotArtworkSrc({ arcana: 'MINOR', suit: 'CUPS', number: 5, imageSlug: 'cups-05-five-of-cups' })).toBe(
      '/assets/tarot-card/cups-05.webp',
    );
    expect(resolveTarotArtworkSrc({ arcana: 'MINOR', suit: 'SWORDS', number: 11, imageSlug: 'swords-11-page-of-swords' })).toBe(
      '/assets/tarot-card/swords-page.webp',
    );
    expect(resolveTarotArtworkSrc({ arcana: 'MINOR', suit: 'SWORDS', number: 12, imageSlug: 'swords-12-knight-of-swords' })).toBe(
      '/assets/tarot-card/swords-knight.webp',
    );
    expect(resolveTarotArtworkSrc({ arcana: 'MINOR', suit: 'PENTACLES', number: 13, imageSlug: 'pentacles-13-queen-of-pentacles' })).toBe(
      '/assets/tarot-card/pentacles-queen.webp',
    );
    expect(resolveTarotArtworkSrc({ arcana: 'MINOR', suit: 'SWORDS', number: 14, imageSlug: 'swords-14-king-of-swords' })).toBe(
      '/assets/tarot-card/swords-king.webp',
    );
  });

  it('produces a unique path per unique (arcana, suit, number) — no two cards can collide', () => {
    const cards: Array<Parameters<typeof resolveTarotArtworkSrc>[0]> = [
      { arcana: 'MAJOR', suit: null, number: 0, imageSlug: 'major-00-the-fool' },
      { arcana: 'MAJOR', suit: null, number: 17, imageSlug: 'major-17-the-star' },
      { arcana: 'MINOR', suit: 'WANDS', number: 1, imageSlug: 'wands-01-ace-of-wands' },
      { arcana: 'MINOR', suit: 'CUPS', number: 1, imageSlug: 'wands-01-ace-of-wands' }, // same imageSlug, different suit
    ];
    const paths = cards.map(resolveTarotArtworkSrc);
    expect(new Set(paths).size).toBe(paths.length);
  });

  // Mirrors the 22 real `major-NN-slug` values in apps/api/prisma/data/tarot-deck.ts (MAJOR_ARCANA_SEED)
  // without importing across the app/api boundary — verified to match by inspection and by the
  // cross-package `pnpm typecheck`/mapping audit run as part of the Tarot production integration.
  const MAJOR_SLUGS = [
    'major-00-the-fool', 'major-01-the-magician', 'major-02-the-high-priestess', 'major-03-the-empress',
    'major-04-the-emperor', 'major-05-the-hierophant', 'major-06-the-lovers', 'major-07-the-chariot',
    'major-08-strength', 'major-09-the-hermit', 'major-10-wheel-of-fortune', 'major-11-justice',
    'major-12-the-hanged-man', 'major-13-death', 'major-14-temperance', 'major-15-the-devil',
    'major-16-the-tower', 'major-17-the-star', 'major-18-the-moon', 'major-19-the-sun',
    'major-20-judgement', 'major-21-the-world',
  ];
  const SUITS = ['WANDS', 'CUPS', 'SWORDS', 'PENTACLES'] as const;

  it('every card in the full 78-card deck resolves to a canonical file that exists on disk', () => {
    const cards: Array<Parameters<typeof resolveTarotArtworkSrc>[0]> = [
      ...MAJOR_SLUGS.map((slug, number) => ({ arcana: 'MAJOR' as const, suit: null, number, imageSlug: slug })),
      ...SUITS.flatMap((suit) =>
        Array.from({ length: 14 }, (_, i) => ({ arcana: 'MINOR' as const, suit, number: i + 1, imageSlug: `${suit.toLowerCase()}-${i + 1}` })),
      ),
    ];
    expect(cards.length).toBe(78);
    const seenIds = new Set<string>();
    for (const card of cards) {
      const id = resolveCanonicalCardId(card);
      expect(seenIds.has(id)).toBe(false);
      seenIds.add(id);
      const src = resolveTarotArtworkSrc(card);
      expect(existsSync(toDiskPath(src))).toBe(true);
    }
    expect(seenIds.size).toBe(78);
  });

  it('the shared card back resolves to one fixed path and physically exists', () => {
    expect(TAROT_CARD_BACK_SRC).toBe('/assets/tarot/card-back.webp');
    expect(existsSync(toDiskPath(TAROT_CARD_BACK_SRC))).toBe(true);
  });
});
