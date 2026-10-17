import type { TarotCard } from './tarot-api';

/** Canonical 78-card artwork shipped by the Web production site.
 * Remote delivery is a temporary native bridge; native bundling/offline QA remains a release gate.
 * Never derive URLs from untrusted imageSlug without validating the card metadata.
 */
const BASE = 'https://tuvitarot.vn/assets/tarot-card/';
const RANK: Record<number, string> = { 1: 'ace', 2: '02', 3: '03', 4: '04', 5: '05', 6: '06', 7: '07', 8: '08', 9: '09', 10: '10', 11: 'page', 12: 'knight', 13: 'queen', 14: 'king' };

export const TAROT_BACK_URI = 'https://tuvitarot.vn/assets/tarot/card-back.webp';

export function tarotArtworkUri(card: TarotCard): string | null {
  if (card.arcana === 'MAJOR' && typeof card.imageSlug === 'string' && /^major-(?:0[0-9]|1[0-9]|2[01])-[a-z-]+$/.test(card.imageSlug)) {
    return `${BASE}${card.imageSlug.slice(6)}.webp`;
  }
  if (card.arcana === 'MINOR' && typeof card.suit === 'string' && typeof card.number === 'number') {
    const suit = card.suit.toLowerCase();
    const rank = RANK[card.number];
    if (['wands', 'cups', 'swords', 'pentacles'].includes(suit) && rank) return `${BASE}${suit}-${rank}.webp`;
  }
  return null;
}
