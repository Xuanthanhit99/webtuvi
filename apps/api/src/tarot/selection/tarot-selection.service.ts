import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID } from 'node:crypto';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { TarotReadingType } from '@prisma/client';
import type { AppConfiguration } from '../../config/configuration';
import { PrismaService } from '../../prisma/prisma.service';
import { drawCards, DRAW_ALGORITHM_VERSION } from '../draw/tarot-draw-engine.util';

export interface TarotSelectionSession {
  token: string;
  type: TarotReadingType;
  cardCount: number;
  deckSize: number;
  expiresAt: string;
}

export interface ResolvedTarotSelection {
  seed: string;
  algorithm: string;
  shuffledCardIds: string[];
  drawnCards: { cardId: string; isReversed: boolean }[];
}

interface Payload { userId: string; type: TarotReadingType; seed: string; exp: number; nonce: string }

const TTL_MS = 15 * 60 * 1000;
const COUNT: Record<TarotReadingType, number> = { DAILY_DRAW: 1, SINGLE_CARD: 1, THREE_CARD: 3 };

@Injectable()
export class TarotSelectionService {
  private readonly key: Buffer;

  constructor(
    private readonly prisma: PrismaService,
    configService: ConfigService,
  ) {
    const config = configService.get<AppConfiguration>('app');
    if (!config?.jwt.accessSecret) {
      throw new Error('JWT_ACCESS_SECRET is required for Tarot selection sessions');
    }
    this.key = createHash('sha256').update(`tarot-selection-v1:${config.jwt.accessSecret}`).digest();
  }

  async create(userId: string, type: TarotReadingType): Promise<TarotSelectionSession> {
    const deckSize = await this.prisma.tarotCard.count();
    if (deckSize !== 78) throw new BadRequestException({ code: 'TAROT_DECK_INCOMPLETE', message: 'Bộ Tarot 78 lá hiện chưa sẵn sàng.' });
    const payload: Payload = { userId, type, seed: randomUUID(), exp: Date.now() + TTL_MS, nonce: randomUUID() };
    return { token: this.encrypt(payload), type, cardCount: COUNT[type], deckSize, expiresAt: new Date(payload.exp).toISOString() };
  }

  async resolve(userId: string, type: TarotReadingType, token: string, selectedPositions: number[]): Promise<ResolvedTarotSelection> {
    const payload = this.decrypt(token);
    if (payload.userId !== userId || payload.type !== type || payload.exp < Date.now()) {
      throw new BadRequestException({ code: 'TAROT_SELECTION_INVALID', message: 'Phiên chọn bài đã hết hạn hoặc không hợp lệ.' });
    }
    const count = COUNT[type];
    if (selectedPositions.length !== count || new Set(selectedPositions).size !== count || selectedPositions.some((x) => !Number.isInteger(x) || x < 0 || x >= 78)) {
      throw new BadRequestException({ code: 'TAROT_SELECTION_INVALID', message: `Hãy chọn đúng ${count} vị trí khác nhau trong bộ 78 lá.` });
    }
    const cards = await this.prisma.tarotCard.findMany({ orderBy: { slug: 'asc' }, select: { id: true } });
    if (cards.length !== 78) throw new BadRequestException({ code: 'TAROT_DECK_INCOMPLETE', message: 'Bộ Tarot 78 lá hiện chưa sẵn sàng.' });
    const full = drawCards({ cardIds: cards.map((card) => card.id), count: 78, seed: payload.seed });
    return {
      seed: full.seed,
      algorithm: `${DRAW_ALGORITHM_VERSION}+user-position-v1`,
      shuffledCardIds: full.shuffledCardIds,
      drawnCards: selectedPositions.map((position) => full.drawnCards[position]!),
    };
  }

  private encrypt(payload: Payload): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    const ciphertext = Buffer.concat([cipher.update(JSON.stringify(payload), 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, ciphertext]).toString('base64url');
  }

  private decrypt(token: string): Payload {
    try {
      const packed = Buffer.from(token, 'base64url');
      const iv = packed.subarray(0, 12);
      const tag = packed.subarray(12, 28);
      const decipher = createDecipheriv('aes-256-gcm', this.key, iv);
      decipher.setAuthTag(tag);
      return JSON.parse(Buffer.concat([decipher.update(packed.subarray(28)), decipher.final()]).toString('utf8')) as Payload;
    } catch {
      throw new BadRequestException({ code: 'TAROT_SELECTION_INVALID', message: 'Phiên chọn bài không hợp lệ.' });
    }
  }
}
