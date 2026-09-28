import { BadRequestException } from '@nestjs/common';
import { TarotSelectionService } from './tarot-selection.service';

const cards = Array.from({ length: 78 }, (_, i) => ({ id: `card-${String(i).padStart(2, '0')}` }));

describe('TarotSelectionService', () => {
  const prisma = { tarotCard: { count: jest.fn().mockResolvedValue(78), findMany: jest.fn().mockResolvedValue(cards) } };
  const configService = { get: jest.fn().mockReturnValue({ jwt: { accessSecret: 'test-access-secret-that-is-at-least-32-characters' } }) };
  const service = new TarotSelectionService(prisma as never, configService as never);

  it('creates an opaque session for a complete 78-card deck', async () => {
    const session = await service.create('u1', 'SINGLE_CARD');
    expect(session.deckSize).toBe(78);
    expect(session.cardCount).toBe(1);
    expect(session.token).not.toContain('card-');
  });

  it('resolves the exact selected positions from the hidden shuffled deck', async () => {
    const session = await service.create('u1', 'THREE_CARD');
    const result = await service.resolve('u1', 'THREE_CARD', session.token, [0, 17, 77]);
    expect(result.drawnCards.map((x) => x.cardId)).toEqual([
      result.shuffledCardIds[0], result.shuffledCardIds[17], result.shuffledCardIds[77],
    ]);
    expect(new Set(result.drawnCards.map((x) => x.cardId)).size).toBe(3);
    expect(result.shuffledCardIds).toHaveLength(78);
  });

  it('rejects duplicate, out-of-range, wrong-count, owner and type mismatches', async () => {
    const session = await service.create('u1', 'THREE_CARD');
    for (const positions of [[0], [0, 0, 1], [0, 1, 78]]) {
      await expect(service.resolve('u1', 'THREE_CARD', session.token, positions)).rejects.toBeInstanceOf(BadRequestException);
    }
    await expect(service.resolve('u2', 'THREE_CARD', session.token, [0, 1, 2])).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.resolve('u1', 'SINGLE_CARD', session.token, [0])).rejects.toBeInstanceOf(BadRequestException);
  });
});
