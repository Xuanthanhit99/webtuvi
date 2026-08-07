'use client';

import Link from 'next/link';
import { ReviewWindowView } from './review-window-view';
import { ReviewDetail } from './review-detail';
import { Button } from '@/components/ui/button';
import { WINDOW_LABELS } from '../labels';

const WINDOW_ALIASES: Record<string, 'week' | 'month'> = {
  week: 'week',
  weekly: 'week',
  month: 'month',
  monthly: 'month',
};

/**
 * `/reviews/:param` resolves to either the current-period view (`week`/`weekly`/`month`/`monthly`)
 * or a specific review by id (a real cuid, everything else) — the same single-dynamic-segment
 * route shape the sprint brief specifies, disambiguated by the param's own value rather than a
 * separate route tree.
 */
export function ReviewParamRouter({ param }: { param: string }) {
  const window = WINDOW_ALIASES[param.toLowerCase()];

  return (
    <div className="flex flex-col gap-4">
      <Link href="/reviews">
        <Button variant="ghost" size="sm">
          Back to Reviews
        </Button>
      </Link>
      {window ? (
        <>
          <h1 className="font-display text-heading-lg text-text-primary">{WINDOW_LABELS[window.toUpperCase() as 'WEEK' | 'MONTH']} review</h1>
          <ReviewWindowView window={window} />
        </>
      ) : (
        <ReviewDetail id={param} />
      )}
    </div>
  );
}
