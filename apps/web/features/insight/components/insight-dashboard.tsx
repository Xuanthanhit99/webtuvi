'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { insightApi } from '../api/insight-api';
import { InsightCardDetail } from './insight-card-detail';
import { InsightCardList } from './insight-card-list';
import { InsightTimeline } from './insight-timeline';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { MvPage, MvPageHeader } from '@/components/ui/mv-page';

type Section = 'top' | 'recent' | 'timeline' | 'pinned' | 'archived';

const SECTIONS: { value: Section; label: string }[] = [
  { value: 'top', label: 'Top insights' },
  { value: 'recent', label: 'Recent insights' },
  { value: 'timeline', label: 'Timeline' },
  { value: 'pinned', label: 'Pinned' },
  { value: 'archived', label: 'Archived' },
];

/**
 * `/insights`'s shell — the Insight Experience (Sprint 5A). Renders exactly the presentation
 * objects the backend already produced (Phase 1/2) from existing, already-generated
 * `InsightCandidate` rows; this page never triggers or implies new insight generation. Sections
 * (Phase 5): Top/Recent/Timeline/Pinned/Archived, each backed by `GET /insight-candidates/cards`
 * or `.../timeline`, plus the shared `?item=<id>` "open detail in place" pattern (Reason + Why it
 * matters + Evidence View) every other module in this product already uses.
 */
export function InsightDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [section, setSection] = useState<Section>('top');
  const activeId = searchParams.get('item');

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['insight-candidates', 'statistics'],
    queryFn: () => insightApi.statistics(),
  });

  function selectItem(id: string | null) {
    router.replace(id ? `/insights?item=${id}` : '/insights', { scroll: false });
  }

  const hasNoInsightsAtAll = stats?.total === 0;

  return (
    <MvPage>
      <MvPageHeader
        eyebrow="Insights"
        title="Những kết nối đáng chú ý trong hành trình của bạn"
        description="Patterns Tử Vi Tarot has connected across your reflections — what happened, why it matters, and the real evidence behind it. Never AI-generated: every insight here traces back to reflections you can inspect yourself."
      />

      {statsLoading && <Skeleton className="h-10 w-full" />}

      {!statsLoading && hasNoInsightsAtAll && !activeId && (
        <EmptyState
          title="No insights yet"
          description="As your reflections build up connections — supporting, repeating, or contradicting each other — insights will be prepared here."
        />
      )}

      {!hasNoInsightsAtAll && !activeId && (
        <nav aria-label="Insight sections" className="flex flex-wrap gap-2 border-b border-border-subtle pb-2">
          {SECTIONS.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setSection(s.value)}
              aria-current={section === s.value ? 'page' : undefined}
              className={`rounded-md px-3 py-1.5 text-body-sm font-medium transition-colors duration-fast ${
                section === s.value ? 'bg-surface text-text-primary' : 'text-text-secondary hover:bg-surface hover:text-text-primary'
              }`}
            >
              {s.label}
            </button>
          ))}
        </nav>
      )}

      {activeId ? (
        <InsightCardDetail id={activeId} onClose={() => selectItem(null)} />
      ) : (
        !hasNoInsightsAtAll && (
          <>
            {section === 'top' && (
              <InsightCardList
                baseFilters={{ sort: 'priority' }}
                showStatus
                emptyTitle="No top insights"
                emptyDescription="Higher-priority insights will appear here as more connected reflections build up."
                onSelect={selectItem}
              />
            )}
            {section === 'recent' && (
              <InsightCardList
                baseFilters={{ sort: 'recent' }}
                showStatus
                emptyTitle="No recent insights"
                emptyDescription="Newly prepared insights will appear here."
                onSelect={selectItem}
              />
            )}
            {section === 'timeline' && <InsightTimeline onSelect={selectItem} />}
            {section === 'pinned' && (
              <InsightCardList
                baseFilters={{ pinned: true, sort: 'recent' }}
                showStatus
                emptyTitle="Nothing pinned"
                emptyDescription="Pin an insight from any list to keep it here."
                onSelect={selectItem}
              />
            )}
            {section === 'archived' && (
              <InsightCardList
                baseFilters={{ status: 'ARCHIVED', sort: 'recent' }}
                showStatus={false}
                emptyTitle="Nothing archived"
                emptyDescription="Insights you archive will appear here."
                onSelect={selectItem}
              />
            )}
          </>
        )
      )}
    </MvPage>
  );
}
