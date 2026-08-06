'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { insightApi } from '../api/insight-api';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';

/**
 * Phase 3 — Evidence View. One `InsightEvidenceCard` per real `ReflectionCandidate` the insight
 * cites (always linkable, `/reflections?item=id`), each expanded to the real Journal/Memory/
 * Activity/Companion records that reflection itself was built from. `JOURNAL`/`MEMORY` sources
 * deep-link to their own detail view; `ACTIVITY`/`COMPANION` sources render as plain rows (no
 * standalone detail view exists for them in this product) — mirrors
 * `ReflectionSourceViewer`'s own rule exactly. A source flagged `available: false` (Phase 8 —
 * deleted/archived/stale) renders as a disabled, non-clickable row instead of a dead link.
 */
export function InsightEvidenceView({ insightId }: { insightId: string }) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['insight-candidates', insightId, 'evidence'],
    queryFn: () => insightApi.evidence(insightId),
  });

  if (isLoading) return <Skeleton className="h-40 w-full" />;
  if (isError || !data) return <ErrorState description="Couldn't load evidence for this insight." onRetry={() => refetch()} />;
  if (data.length === 0) return <p className="text-body-sm text-text-secondary">No evidence currently backs this insight.</p>;

  return (
    <ul className="flex flex-col gap-3" aria-label="Insight evidence">
      {data.map((item) => (
        <li key={item.reflectionCandidateId} className="rounded-md border border-border-subtle bg-surface p-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="neutral">{item.reflectionCategory}</Badge>
            <Badge variant="neutral">Score {item.reflectionScore}</Badge>
            {item.reflectionState !== 'READY' && <Badge variant="neutral">{item.reflectionState}</Badge>}
          </div>
          <p className="mt-1 text-body-sm text-text-primary">{item.contribution}</p>
          <Link href={item.href} className="mt-1 inline-block text-caption text-insight hover:underline">
            View reflection
          </Link>

          {item.sources.length > 0 && (
            <ul className="mt-2 flex flex-col gap-1.5 border-l-2 border-border-subtle pl-3" aria-label="Underlying sources">
              {item.sources.map((source, index) => {
                const key = `${source.sourceType}:${source.sourceId}:${index}`;
                const when = new Date(source.sourceTimestamp).toLocaleDateString();
                const label = source.available ? source.sourceTypeLabel : `${source.sourceTypeLabel} (no longer available)`;

                if (source.href) {
                  return (
                    <li key={key}>
                      <Link
                        href={source.href}
                        className="flex items-center justify-between gap-3 rounded-md bg-surface-raised px-2.5 py-1.5 text-body-sm transition-colors duration-fast hover:bg-border-subtle"
                      >
                        <span className="text-text-primary">{label}</span>
                        <span className="text-caption text-text-disabled">{when}</span>
                      </Link>
                    </li>
                  );
                }
                return (
                  <li
                    key={key}
                    className={`flex items-center justify-between gap-3 rounded-md bg-surface-raised px-2.5 py-1.5 text-body-sm ${source.available ? '' : 'opacity-60'}`}
                  >
                    <span className="text-text-primary">{label}</span>
                    <span className="text-caption text-text-disabled">{when}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
}
