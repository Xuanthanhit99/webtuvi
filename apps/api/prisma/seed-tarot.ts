import type { PrismaClient } from '@prisma/client';
import { TAROT_DECK } from './data/tarot-deck';

/** Real, fixed spread templates — never generated per-reading. Matches the three reading types
 * this sprint supports (see docs/architecture/tarot-discovery.md "Reading types"). */
const TAROT_SPREADS = [
  { slug: 'daily-draw', name: 'Lá bài hôm nay', cardCount: 1, positions: [{ order: 0, label: 'Hôm nay' }] },
  { slug: 'single-card', name: 'Một lá bài', cardCount: 1, positions: [{ order: 0, label: 'Trọng tâm' }] },
  {
    slug: 'three-card-ppf',
    name: 'Trải bài ba lá',
    cardCount: 3,
    positions: [
      { order: 0, label: 'Quá khứ' },
      { order: 1, label: 'Hiện tại' },
      { order: 2, label: 'Tương lai' },
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
        nameVi: card.nameVi,
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
        reflectionPrompts: card.reflectionPrompts,
        loveMeaning: card.loveMeaning,
        careerMeaning: card.careerMeaning,
        financeMeaning: card.financeMeaning,
        selfMeaning: card.selfMeaning,
        deckVersion: card.deckVersion,
      },
    });
  }

  console.log(`Seeded Tarot deck: ${TAROT_DECK.length} cards, ${TAROT_SPREADS.length} spreads.`);
}
