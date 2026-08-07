import { randomUUID } from 'node:crypto';

/**
 * Phase 2 — the deterministic draw engine. Pure functions only: no DB access, no I/O, no
 * "creativity" — every output is a deterministic function of its inputs. "Never fabricate a card"
 * is enforced by construction here: the engine only ever shuffles and slices a caller-supplied
 * list of real card ids, it never invents one.
 *
 * Reproducibility (Phase 2's own explicit requirement): given the same `seed`, the same
 * `cardIds` (in the same order — callers must pass a stable, deterministic ordering, e.g. sorted
 * by `slug`), the same `count`, and the same `allowReversed`, `drawCards()` always returns the
 * identical shuffle and the identical reversed/upright assignment. This is what
 * `TarotReadingSession` persists (`seed` + `algorithm` + `shuffledCardIds`) so any past reading
 * can be independently re-verified, not just trusted.
 */
export const DRAW_ALGORITHM_VERSION = 'fisher-yates-mulberry32-v1';

export interface DrawnCard {
  cardId: string;
  isReversed: boolean;
}

export interface DrawResult {
  seed: string;
  algorithm: string;
  /** The full deck, in the exact shuffled order the draw was taken from the front of — persisted
   * verbatim for independent reproducibility verification. */
  shuffledCardIds: string[];
  drawnCards: DrawnCard[];
}

export interface DrawParams {
  /** Must be passed in a stable, deterministic order (callers: always sort by a real, fixed key
   * such as `slug` before calling) — the shuffle is a deterministic function of this order plus
   * the seed, so an unstable input order would silently break reproducibility. */
  cardIds: string[];
  count: number;
  /** Auto-generated (a real random UUID) when omitted; always returned so it can be persisted and
   * later used to reproduce this exact draw. */
  seed?: string;
  /** Module 12: reversed cards are optional, on by default. */
  allowReversed?: boolean;
}

/** djb2 — a fast, deterministic string hash, used only to turn an arbitrary seed string into a
 * 32-bit integer for the PRNG below. Not cryptographic; this engine's security property is
 * "reproducible," not "unpredictable." */
function hashSeedToInt(seed: string): number {
  let hash = 5381;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 33) ^ seed.charCodeAt(i);
  }
  return hash >>> 0;
}

/** mulberry32 — a small, fast, deterministic PRNG. Given the same integer seed it always produces
 * the same sequence of [0, 1) floats. */
function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], rng: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

/** Draws `count` real cards without replacement from `cardIds`, deterministically, from a seeded
 * shuffle of the full input list — never a fabricated or repeated card. */
export function drawCards(params: DrawParams): DrawResult {
  if (params.count < 1) {
    throw new Error('drawCards: count must be at least 1.');
  }
  if (params.count > params.cardIds.length) {
    throw new Error('drawCards: count cannot exceed the number of available cards.');
  }

  const seed = params.seed ?? randomUUID();
  const allowReversed = params.allowReversed ?? true;
  const rng = mulberry32(hashSeedToInt(seed));

  const shuffledCardIds = shuffle(params.cardIds, rng);
  const drawnCards: DrawnCard[] = shuffledCardIds.slice(0, params.count).map((cardId) => ({
    cardId,
    isReversed: allowReversed ? rng() < 0.5 : false,
  }));

  return { seed, algorithm: DRAW_ALGORITHM_VERSION, shuffledCardIds, drawnCards };
}
