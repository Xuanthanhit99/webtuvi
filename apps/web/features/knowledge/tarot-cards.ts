import { TAROT_DECK, type TarotCardSeed } from '../../../api/prisma/data/tarot-deck';

export const TAROT_CARD_SEO_PATH = '/kien-thuc/tarot/la-bai';
export const TAROT_SEO_UPDATED_AT = '2026-09-27T00:00:00+07:00';

export const tarotSeoCards = TAROT_DECK;

export function tarotCardBySlug(slug: string): TarotCardSeed | undefined {
  return TAROT_DECK.find((card) => card.slug === slug);
}

export function tarotArcanaLabel(card: TarotCardSeed): string {
  if (card.arcana === 'MAJOR') return 'Major Arcana';
  const suits: Record<Exclude<TarotCardSeed['suit'], null>, string> = {
    WANDS: 'Gậy',
    CUPS: 'Cốc',
    SWORDS: 'Kiếm',
    PENTACLES: 'Tiền',
  };
  return card.suit ? `Minor Arcana · Bộ ${suits[card.suit]}` : 'Minor Arcana';
}

export function tarotCardTitle(card: TarotCardSeed): string {
  return `${card.nameVi} (${card.name}) – ý nghĩa lá bài Tarot`;
}

export function tarotCardDescription(card: TarotCardSeed): string {
  const keywords = card.uprightKeywords.slice(0, 3).join(', ');
  return `Ý nghĩa lá ${card.nameVi} (${card.name}) trong Tarot: xuôi, ngược, tình yêu, công việc, tài chính và câu hỏi tự chiêm nghiệm. Từ khóa: ${keywords}.`;
}

export function tarotRelatedCards(card: TarotCardSeed): TarotCardSeed[] {
  const index = TAROT_DECK.findIndex((item) => item.slug === card.slug);
  if (index < 0) return [];
  const previous = TAROT_DECK[(index - 1 + TAROT_DECK.length) % TAROT_DECK.length];
  const next = TAROT_DECK[(index + 1) % TAROT_DECK.length];
  if (!previous || !next) return [];
  return previous.slug === next.slug ? [previous] : [previous, next];
}
