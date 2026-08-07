import { NotFoundException } from '@nestjs/common';
import { TarotDeckService } from './tarot-deck.service';

function makeCard(overrides: Partial<{ id: string; slug: string; name: string; arcana: string; suit: string | null; number: number; uprightKeywords: string[]; categories: string[] }> = {}) {
  return {
    id: overrides.id ?? 'card-1',
    slug: overrides.slug ?? 'major-00-the-fool',
    name: overrides.name ?? 'The Fool',
    arcana: overrides.arcana ?? 'MAJOR',
    suit: overrides.suit ?? null,
    number: overrides.number ?? 0,
    uprightKeywords: overrides.uprightKeywords ?? ['beginnings', 'innocence'],
    uprightMeaning: 'A leap of faith.',
    reversedKeywords: ['recklessness'],
    reversedMeaning: 'Naivety, risk taken too far.',
    element: 'Air',
    astrological: 'Uranus',
    categories: overrides.categories ?? ['new-beginnings'],
    imageSlug: overrides.slug ?? 'major-00-the-fool',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  };
}

function makePrismaMock(cards: ReturnType<typeof makeCard>[]) {
  return {
    tarotCard: {
      findMany: jest.fn(async ({ where }: { where: Record<string, unknown> } = { where: {} }) => {
        return cards.filter((card) => {
          if (where.arcana && card.arcana !== where.arcana) return false;
          if (where.suit && card.suit !== where.suit) return false;
          if (where.categories) {
            const has = (where.categories as { has: string }).has;
            if (has && !card.categories.includes(has)) return false;
          }
          if (where.OR) {
            const clauses = where.OR as Array<Record<string, unknown>>;
            const matches = clauses.some((clause) => {
              if (clause.name) {
                const contains = (clause.name as { contains: string }).contains.toLowerCase();
                return card.name.toLowerCase().includes(contains);
              }
              if (clause.uprightKeywords) {
                const hasSome = (clause.uprightKeywords as { hasSome: string[] }).hasSome;
                return hasSome.some((kw) => card.uprightKeywords.includes(kw));
              }
              if (clause.categories) {
                const hasSome = (clause.categories as { hasSome: string[] }).hasSome;
                return hasSome.some((c) => card.categories.includes(c));
              }
              return false;
            });
            if (!matches) return false;
          }
          return true;
        });
      }),
      findUnique: jest.fn(async ({ where: { slug } }: { where: { slug: string } }) => cards.find((c) => c.slug === slug) ?? null),
    },
  };
}

function makeService(cards: ReturnType<typeof makeCard>[]) {
  const prisma = makePrismaMock(cards);
  return { service: new TarotDeckService(prisma as never), prisma };
}

describe('TarotDeckService', () => {
  const deck = [
    makeCard({ id: 'c1', slug: 'major-00-the-fool', name: 'The Fool', arcana: 'MAJOR', suit: null, categories: ['new-beginnings'] }),
    makeCard({ id: 'c2', slug: 'minor-wands-ace', name: 'Ace of Wands', arcana: 'MINOR', suit: 'WANDS', number: 1, categories: ['inspiration'], uprightKeywords: ['creation', 'potential'] }),
    makeCard({ id: 'c3', slug: 'minor-cups-ace', name: 'Ace of Cups', arcana: 'MINOR', suit: 'CUPS', number: 1, categories: ['emotion'], uprightKeywords: ['love', 'compassion'] }),
  ];

  it('lists every card with no filters', async () => {
    const { service } = makeService(deck);
    const result = await service.list({});
    expect(result).toHaveLength(3);
  });

  it('filters by arcana', async () => {
    const { service } = makeService(deck);
    const result = await service.list({ arcana: 'MINOR' as never });
    expect(result.map((c) => c.slug)).toEqual(['minor-wands-ace', 'minor-cups-ace']);
  });

  it('filters by suit', async () => {
    const { service } = makeService(deck);
    const result = await service.list({ suit: 'CUPS' as never });
    expect(result).toHaveLength(1);
    expect(result[0]!.slug).toBe('minor-cups-ace');
  });

  it('filters by category', async () => {
    const { service } = makeService(deck);
    const result = await service.list({ category: 'emotion' });
    expect(result.map((c) => c.slug)).toEqual(['minor-cups-ace']);
  });

  it('filters by search across name and keywords', async () => {
    const { service } = makeService(deck);
    const byName = await service.list({ search: 'fool' });
    expect(byName.map((c) => c.slug)).toEqual(['major-00-the-fool']);

    const byKeyword = await service.list({ search: 'love' });
    expect(byKeyword.map((c) => c.slug)).toEqual(['minor-cups-ace']);
  });

  it('getBySlug returns the matching card', async () => {
    const { service } = makeService(deck);
    const result = await service.getBySlug('major-00-the-fool');
    expect(result.name).toBe('The Fool');
  });

  it('getBySlug throws TAROT_CARD_NOT_FOUND for an unknown slug', async () => {
    const { service } = makeService(deck);
    await expect(service.getBySlug('does-not-exist')).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.getBySlug('does-not-exist')).rejects.toMatchObject({ response: { code: 'TAROT_CARD_NOT_FOUND' } });
  });
});
