import type { TarotCardDto } from '@beaconvie/types';

/**
 * Tarot 78-Card Completion — the single centralized artwork manifest (master brief §40
 * "Artwork-integration readiness"). This is the ONLY place a card's `imageSlug` becomes a real
 * file path. Adding final artwork later requires placing files at these exact paths — no other
 * code change, no database migration. See docs/design/tarot-78-artwork-contract.md for the full,
 * founder-facing list of every expected file.
 *
 * `TarotCardVisual` (tarot-card-face.tsx) already renders a typographic fallback face whenever
 * `imageSrc` is absent or fails to load — this resolver deliberately always returns a path (never
 * `null`) so a missing file fails over silently via that existing `onError` handler, not a broken-
 * image icon.
 */
export function resolveTarotArtworkSrc(card: Pick<TarotCardDto, 'arcana' | 'suit' | 'imageSlug'>): string {
  if (card.arcana === 'MAJOR') {
    return `/assets/tarot/cards/major/${card.imageSlug}.webp`;
  }
  const suitFolder = (card.suit ?? 'wands').toLowerCase();
  return `/assets/tarot/cards/minor/${suitFolder}/${card.imageSlug}.webp`;
}

/**
 * Tarot 78-Card Artwork Production pass — the one shared card-back image (founder-approved,
 * `docs/design/tarot-78-art-bible.md`). Not part of the 78-card front-artwork contract — a single
 * asset reused for every face-down card, never per-card. Add real art later by replacing this file
 * on disk; no code change needed here unless the path itself changes.
 */
export const TAROT_CARD_BACK_SRC = '/assets/tarot/card-back.webp';
