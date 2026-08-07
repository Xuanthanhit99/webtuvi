'use client';

import type { ReviewSummaryDto } from '@beaconvie/types';
import { Badge } from '@/components/ui/badge';
import { STATE_BADGE_VARIANT, STATE_LABELS, WINDOW_LABELS } from '../labels';

/** Phase 4 — Review Card. Renders only fields already on `ReviewSummaryDto`; never fabricates a
 * summary sentence beyond the backend's own deterministic `overview`. */
export function ReviewCard({ review, onSelect }: { review: ReviewSummaryDto; onSelect: (id: string) => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(review.id)}
        className="flex w-full flex-col gap-1.5 rounded-md border border-border-subtle bg-surface p-4 text-left transition-colors duration-fast hover:bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-insight"
      >
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="insight">{WINDOW_LABELS[review.window]}</Badge>
          <Badge variant={STATE_BADGE_VARIANT[review.state]}>{STATE_LABELS[review.state]}</Badge>
        </div>
        <p className="text-body-md text-text-primary">{review.overview}</p>
        <p className="text-caption text-text-disabled">
          {new Date(review.windowStart).toLocaleDateString()} – {new Date(review.windowEnd).toLocaleDateString()}
        </p>
      </button>
    </li>
  );
}
