import type { PrismaClient } from '@prisma/client';
import { TAROT_DECK } from './data/tarot-deck';

/** Real, fixed spread templates — never generated per-reading. Matches the three reading types
 * this sprint supports (see docs/architecture/tarot-discovery.md "Reading types"). */
const TAROT_SPREADS = [
  { slug: 'daily-draw', name: 'Daily Draw', cardCount: 1, positions: [{ order: 0, label: 'Today' }] },
  { slug: 'single-card', name: 'Single Card', cardCount: 1, positions: [{ order: 0, label: 'Focus' }] },
  {
    slug: 'three-card-ppf',
    name: 'Three Card Spread',
    cardCount: 3,
    positions: [
      { order: 0, label: 'Past' },
      { order: 1, label: 'Present' },
      { order: 2, label: 'Future' },
    ],
  },
];

/** Idempotent — upserts by `slug`, safe to run on every deploy/seed invocation, never duplicates
 * or drops existing readings that reference these rows. */
export async function seedTarotDeck(prisma: PrismaClient): Promise<void> {
  for (const spread of TAROT_SPREADS) {
    await prisma.tarotSpread.upsert({
      where: { slug: spread.slug },
      create: spread,
      update: { name: spread.name, cardCount: spread.cardCount, positions: spread.positions },
    });
  }

  for (const card of TAROT_DECK) {
    await prisma.tarotCard.upsert({
      where: { slug: card.slug },
      create: card,
      update: {
        name: card.name,
        arcana: card.arcana,
        suit: card.suit,
        number: card.number,
        uprightKeywords: card.uprightKeywords,
        uprightMeaning: card.uprightMeaning,
        reversedKeywords: card.reversedKeywords,
        reversedMeaning: card.reversedMeaning,
        element: card.element,
        astrological: card.astrological,
        categories: card.categories,
        imageSlug: card.imageSlug,
      },
    });
  }

  console.log(`Seeded Tarot deck: ${TAROT_DECK.length} cards, ${TAROT_SPREADS.length} spreads.`);
}
