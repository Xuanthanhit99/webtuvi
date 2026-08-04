import type { MemoryType } from '@prisma/client';
import { isGoalRelatedType } from '../importance/memory-importance.calculator';

export interface RankableMemory {
  id: string;
  type: MemoryType;
  importanceScore: number;
  pinned: boolean;
  referencedCount: number;
  createdAt: Date;
  lastReferencedAt: Date | null;
}

/**
 * Deterministic ranking, pure and side-effect free (Phase 7). Sorts strictly descending by
 * "most worth surfacing first," using this fixed, documented tie-break order — see
 * docs/architecture/memory-intelligence.md "Ranking algorithm":
 *
 * 1. Manual pin (pinned memories always outrank unpinned ones).
 * 2. Importance score, descending.
 * 3. Goal relation (GOAL/ACHIEVEMENT/CHALLENGE types outrank others at equal importance).
 * 4. Recency — `lastReferencedAt` if set, else `createdAt` — descending.
 * 5. Frequency — `referencedCount`, descending.
 * 6. `id`, ascending — a final, arbitrary-but-stable tiebreaker so ranking never depends on
 *    input array order or produces a different result across two calls with identical data.
 */
export function rankMemories<T extends RankableMemory>(items: T[]): T[] {
  return [...items].sort(compareForRanking);
}

function compareForRanking(a: RankableMemory, b: RankableMemory): number {
  if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
  if (a.importanceScore !== b.importanceScore) return b.importanceScore - a.importanceScore;

  const aGoal = isGoalRelatedType(a.type);
  const bGoal = isGoalRelatedType(b.type);
  if (aGoal !== bGoal) return aGoal ? -1 : 1;

  const aRecency = (a.lastReferencedAt ?? a.createdAt).getTime();
  const bRecency = (b.lastReferencedAt ?? b.createdAt).getTime();
  if (aRecency !== bRecency) return bRecency - aRecency;

  if (a.referencedCount !== b.referencedCount) return b.referencedCount - a.referencedCount;

  if (a.id < b.id) return -1;
  if (a.id > b.id) return 1;
  return 0;
}

export function isGoalRelated(type: MemoryType): boolean {
  return isGoalRelatedType(type);
}
