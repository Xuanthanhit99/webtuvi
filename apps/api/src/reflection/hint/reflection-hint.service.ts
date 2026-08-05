import { Injectable } from '@nestjs/common';
import type { ReflectionCategory } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ReflectionGenerationService } from '../generation/reflection-generation.service';
import { ReflectionValidityService } from '../validity/reflection-validity.service';

export interface ReflectionHintDto {
  available: boolean;
  reflectionId: string | null;
  category: ReflectionCategory | null;
}

/**
 * Phase 10 — the one thing Companion is allowed to know about Reflection: whether a `READY`,
 * `COMPANION_VISIBLE` candidate currently exists for the caller. Never the candidate's `reason`,
 * `sources`, or `scoreExplanation` — those are only ever fetched by the user directly opening
 * `/reflections`. Companion never generates a reflection on demand, never fabricates one, never
 * summarizes or coaches from this — it may only say a fixed sentence
 * ("You may want to reflect on this.") and link to `/reflections/:id`, exactly per the mission's
 * Phase 10 constraints. See docs/architecture/reflection-foundation.md "Companion integration".
 */
@Injectable()
export class ReflectionHintService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly generation: ReflectionGenerationService,
    private readonly validity: ReflectionValidityService,
  ) {}

  async getHint(userId: string): Promise<ReflectionHintDto> {
    await this.generation.ensureGenerated(userId);
    await this.validity.revalidateForUser(userId);

    const candidate = await this.prisma.reflectionCandidate.findFirst({
      where: { userId, state: 'READY', visibility: 'COMPANION_VISIBLE' },
      orderBy: [{ score: 'desc' }, { createdAt: 'desc' }],
      select: { id: true, category: true },
    });

    if (!candidate) return { available: false, reflectionId: null, category: null };
    return { available: true, reflectionId: candidate.id, category: candidate.category };
  }
}
