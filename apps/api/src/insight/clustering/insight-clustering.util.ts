import type { InsightRelationshipType } from '@prisma/client';

/** A reflection strong enough on its own to seed a single-evidence Insight Candidate even with no
 * relationship to another reflection — mirrors the same "a single strong signal is still worth
 * surfacing" judgment Reflection Foundation itself makes for `LONG_INACTIVITY`/
 * `GOAL_ACTIVITY_MISMATCH` (single-source rules). Readiness (Phase 5) still requires either >= 2
 * evidence or this same score floor, so a singleton cluster is never automatically READY. */
export const SINGLETON_MIN_SCORE = 70;

export interface ClusterEdge {
  reflectionAId: string;
  reflectionBId: string;
  type: InsightRelationshipType;
  reason: string;
}

export interface ReflectionCluster {
  reflectionIds: string[];
  edges: ClusterEdge[];
}

/**
 * Deterministic connected-components clustering (Phase 1 "InsightCandidate... must reference
 * their source ReflectionCandidates"; Phase 2's own relationship edges are the only clustering
 * signal — no semantic grouping). A plain union-find over the relationship graph, restricted to
 * reflections in the current fetched snapshot (an edge referencing a reflection outside the
 * snapshot — e.g. one that has since expired — is silently ignored, never followed).
 */
export function clusterReflections(
  reflectionIds: string[],
  reflectionScoreById: Map<string, number>,
  edges: ClusterEdge[],
  singletonMinScore: number = SINGLETON_MIN_SCORE,
): ReflectionCluster[] {
  const validIds = new Set(reflectionIds);
  const parent = new Map<string, string>(reflectionIds.map((id) => [id, id]));

  function find(id: string): string {
    let root = id;
    while (parent.get(root) !== root) root = parent.get(root)!;
    let cursor = id;
    while (parent.get(cursor) !== root) {
      const next = parent.get(cursor)!;
      parent.set(cursor, root);
      cursor = next;
    }
    return root;
  }

  function union(a: string, b: string): void {
    const rootA = find(a);
    const rootB = find(b);
    if (rootA !== rootB) parent.set(rootA, rootB);
  }

  const relevantEdges = edges.filter((e) => validIds.has(e.reflectionAId) && validIds.has(e.reflectionBId));
  for (const edge of relevantEdges) {
    union(edge.reflectionAId, edge.reflectionBId);
  }

  const membersByRoot = new Map<string, string[]>();
  for (const id of reflectionIds) {
    const root = find(id);
    const members = membersByRoot.get(root) ?? [];
    members.push(id);
    membersByRoot.set(root, members);
  }

  const clusters: ReflectionCluster[] = [];
  for (const members of membersByRoot.values()) {
    if (members.length >= 2) {
      const memberSet = new Set(members);
      const clusterEdges = relevantEdges.filter((e) => memberSet.has(e.reflectionAId) && memberSet.has(e.reflectionBId));
      clusters.push({ reflectionIds: members, edges: clusterEdges });
    } else {
      const soleId = members[0]!;
      if ((reflectionScoreById.get(soleId) ?? 0) >= singletonMinScore) {
        clusters.push({ reflectionIds: [soleId], edges: [] });
      }
    }
  }

  return clusters;
}
