/** One-off generator for the two founder-facing artwork docs — run manually, not part of any
 * build/test pipeline. Reads TAROT_DECK directly so the docs can never drift from the real deck
 * data. Checks actual file existence on disk for the checklist's status column (never marks
 * READY without a real file present). */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { TAROT_DECK, TAROT_DECK_VERSION } from '../prisma/data/tarot-deck';

function artworkPath(card: (typeof TAROT_DECK)[number]): string {
  if (card.arcana === 'MAJOR') return `/assets/tarot/cards/major/${card.imageSlug}.webp`;
  return `/assets/tarot/cards/minor/${(card.suit ?? '').toLowerCase()}/${card.imageSlug}.webp`;
}

const PUBLIC_ROOT = join(__dirname, '../../web/public');

const contractRows = TAROT_DECK.map((c) => `| ${c.arcana === 'MAJOR' ? c.number : c.suit + ' ' + c.number} | \`${c.slug}\` | ${c.name} | ${c.nameVi} | \`${artworkPath(c)}\` |`).join('\n');

const checklistRows = TAROT_DECK.map((c, i) => {
  const path = artworkPath(c);
  const status = existsSync(join(PUBLIC_ROOT, path.replace(/^\//, ''))) ? 'READY' : 'PENDING_ARTWORK';
  return `| ${i + 1} | \`${c.slug}\` | ${c.name} | ${c.nameVi} | ${c.arcana} | ${c.suit ?? '—'} | ${c.arcana === 'MAJOR' ? c.number : c.number} | \`${c.imageSlug}.webp\` | \`${path}\` | ${status} |`;
}).join('\n');

const readyCards = TAROT_DECK.filter((c) => existsSync(join(PUBLIC_ROOT, artworkPath(c).replace(/^\//, ''))));
const CARD_BACK_PATH = '/assets/tarot/card-back.webp';
const cardBackReady = existsSync(join(PUBLIC_ROOT, CARD_BACK_PATH.replace(/^\//, '')));

console.log('=== deckVersion ===');
console.log(TAROT_DECK_VERSION);
console.log('=== CONTRACT_ROWS ===');
console.log(contractRows);
console.log('=== CHECKLIST_ROWS ===');
console.log(checklistRows);
console.log('=== FRONT_READY_COUNT ===');
console.log(readyCards.length);
console.log('=== FRONT_READY_SLUGS ===');
console.log(readyCards.map((c) => c.slug).join(', ') || '(none)');
console.log('=== FRONT_PENDING_COUNT ===');
console.log(TAROT_DECK.length - readyCards.length);
console.log('=== CARD_BACK_STATUS ===');
console.log(cardBackReady ? 'READY' : 'PENDING_ARTWORK');
