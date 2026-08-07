import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { toTarotCardDto, type TarotCardDto } from '../tarot.mappers';
import type { ListDeckQueryDto } from '../dto/list-deck.dto';

/** Phase 5 — Deck API. Read-only, no ownership scoping (the deck is fixed reference data shared
 * by every user, not user-owned content) — every route is still auth-gated for consistency with
 * the rest of this app, not because the deck itself is sensitive. */
@Injectable()
export class TarotDeckService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListDeckQueryDto): Promise<TarotCardDto[]> {
    const where: Prisma.TarotCardWhereInput = {
      ...(query.arcana ? { arcana: query.arcana } : {}),
      ...(query.suit ? { suit: query.suit } : {}),
      ...(query.category ? { categories: { has: query.category } } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { uprightKeywords: { hasSome: [query.search.toLowerCase()] } },
              { categories: { hasSome: [query.search.toLowerCase()] } },
            ],
          }
        : {}),
    };

    const cards = await this.prisma.tarotCard.findMany({ where, orderBy: [{ arcana: 'asc' }, { suit: 'asc' }, { number: 'asc' }] });
    return cards.map(toTarotCardDto);
  }

  async getBySlug(slug: string): Promise<TarotCardDto> {
    const card = await this.prisma.tarotCard.findUnique({ where: { slug } });
    if (!card) throw new NotFoundException({ code: 'TAROT_CARD_NOT_FOUND', message: 'That card was not found.' });
    return toTarotCardDto(card);
  }
}
