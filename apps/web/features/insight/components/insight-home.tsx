'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { InsightList } from './insight-list';
import { InsightDetail } from './insight-detail';

/**
 * `/insights/internal`'s shell — an internal-facing view of Insight Preparation's output, not a
 * polished end-user surface (Sprint 5 owns that). Deliberately not linked from global nav or
 * Settings — reachable only by direct URL, the same "not every real feature needs a nav slot"
 * precedent Memory (Sprint 3A) established. No "create" action anywhere: candidates are only ever
 * generated deterministically from Reflection Candidates the user already has.
 */
export function InsightHome() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeId = searchParams.get('item');

  function selectItem(id: string | null) {
    router.replace(id ? `/insights/internal?item=${id}` : '/insights/internal', { scroll: false });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-heading-lg text-text-primary">Insight Preparation (internal)</h1>
        <p className="mt-2 text-body-sm text-text-secondary">
          Deterministic evidence prepared from your Reflection Candidates for a future Sprint 5 — never AI-generated, never a
          finished insight. Every candidate here traces back to real reflections, with the relationships and priority always
          shown.
        </p>
      </div>

      {activeId ? <InsightDetail id={activeId} onClose={() => selectItem(null)} /> : <InsightList onSelect={selectItem} />}
    </div>
  );
}
