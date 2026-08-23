import type { TarotCardDto } from '@beaconvie/types';

/**
 * Tarot Production Integration pass — the single centralized artwork manifest. This is the ONLY
 * place a card's identity (arcana/suit/number) becomes a real file path. The 78-card canonical
 * deck lives flat under `/assets/tarot-card/<canonicalId>.webp` (see
 * `apps/web/public/assets/tarot-card/manifest.json`, `tarot-asset-audit.md`,
 * `tarot-asset-final-report.md`). Canonical IDs don't match the DB's `imageSlug` format 1:1 for
 * Minor Arcana (`wands-01-ace-of-wands` vs. `wands-ace`), so the mapping is computed explicitly
 * here from `arcana`/`suit`/`number` rather than by renaming the Prisma seed data — the DB slug
 * stays the durable identity, this function is the only translation layer.
 *
 * `TarotCardVisual` (tarot-card-face.tsx) already renders a typographic fallback face whenever
 * `imageSrc` is absent or fails to load — this resolver deliberately always returns a path (never
 * `null`) so a missing file fails over silently via that existing `onError` handler, not a broken-
 * image icon.
 */
const MINOR_RANK_TOKEN: Record<number, string> = {
  1: 'ace', 2: '02', 3: '03', 4: '04', 5: '05', 6: '06', 7: '07', 8: '08', 9: '09', 10: '10',
  11: 'page', 12: 'knight', 13: 'queen', 14: 'king',
};

/** e.g. `major-17-the-star` -> `17-the-star`; `{ suit: 'WANDS', number: 1 }` -> `wands-ace`. */
export function resolveCanonicalCardId(card: Pick<TarotCardDto, 'arcana' | 'suit' | 'number' | 'imageSlug'>): string {
  if (card.arcana === 'MAJOR') {
    return card.imageSlug.replace(/^major-/, '');
  }
  const suitFolder = (card.suit ?? 'wands').toLowerCase();
  return `${suitFolder}-${MINOR_RANK_TOKEN[card.number]}`;
}

export function resolveTarotArtworkSrc(card: Pick<TarotCardDto, 'arcana' | 'suit' | 'number' | 'imageSlug'>): string {
  return `/assets/tarot-card/${resolveCanonicalCardId(card)}.webp`;
}

/**
 * Tarot 78-Card Artwork Production pass — the one shared card-back image (founder-approved,
 * `docs/design/tarot-78-art-bible.md`). Not part of the 78-card front-artwork contract — a single
 * asset reused for every face-down card, never per-card. Add real art later by replacing this file
 * on disk; no code change needed here unless the path itself changes.
 */
export const TAROT_CARD_BACK_SRC = '/assets/tarot/card-back.webp';
