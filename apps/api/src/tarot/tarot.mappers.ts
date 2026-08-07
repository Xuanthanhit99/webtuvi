import type { TarotCard, TarotReading, TarotReadingCard, TarotReadingHistory, TarotSpread } from '@prisma/client';

export interface TarotCardDto {
  id: string;
  slug: string;
  name: string;
  arcana: TarotCard['arcana'];
  suit: TarotCard['suit'];
  number: number;
  uprightKeywords: string[];
  uprightMeaning: string;
  reversedKeywords: string[];
  reversedMeaning: string;
  element: string | null;
  astrological: string | null;
  categories: string[];
  imageSlug: string;
}

export interface TarotReadingCardDto {
  position: number;
  positionLabel: string | null;
  isReversed: boolean;
  card: TarotCardDto;
}

export interface TarotReadingDto {
  id: string;
  type: TarotReading['type'];
  status: TarotReading['status'];
  visibility: TarotReading['visibility'];
  spreadSlug: string;
  spreadName: string;
  question: string | null;
  interpretation: string | null;
  cards: TarotReadingCardDto[];
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}

export interface TarotReadingHistoryDto {
  id: string;
  action: TarotReadingHistory['action'];
  detail: string;
  createdAt: string;
}

export function toTarotCardDto(card: TarotCard): TarotCardDto {
  return {
    id: card.id,
    slug: card.slug,
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
  };
}

export function toTarotReadingDto(
  reading: TarotReading & { spread: TarotSpread; cards: (TarotReadingCard & { card: TarotCard })[] },
): TarotReadingDto {
  return {
    id: reading.id,
    type: reading.type,
    status: reading.status,
    visibility: reading.visibility,
    spreadSlug: reading.spread.slug,
    spreadName: reading.spread.name,
    question: reading.question,
    interpretation: reading.interpretation,
    cards: [...reading.cards]
      .sort((a, b) => a.position - b.position)
      .map((rc) => ({
        position: rc.position,
        positionLabel: rc.positionLabel,
        isReversed: rc.isReversed,
        card: toTarotCardDto(rc.card),
      })),
    createdAt: reading.createdAt.toISOString(),
    updatedAt: reading.updatedAt.toISOString(),
    archivedAt: reading.archivedAt?.toISOString() ?? null,
  };
}

export function toTarotReadingHistoryDto(entry: TarotReadingHistory): TarotReadingHistoryDto {
  return { id: entry.id, action: entry.action, detail: entry.detail, createdAt: entry.createdAt.toISOString() };
}
