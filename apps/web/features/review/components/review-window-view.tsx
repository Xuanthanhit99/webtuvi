'use client';

import { reviewApi } from '../api/review-api';
import { ReviewContent } from './review-content';
import type { ReviewDetailFilters } from '../api/review-api';

/** `/reviews/:window` (week|month) — generates (or returns the already-materialized) current
 * period's review. Filters apply client-side to the fetched review via the same `ReviewContent`
 * body `/reviews/:id` uses. */
export function ReviewWindowView({ window }: { window: 'week' | 'month' }) {
  return (
    <ReviewContent
      queryKey={['reviews', 'current', window]}
      fetcher={(filters: ReviewDetailFilters) =>
        reviewApi.current(window).then((review) => (filters.category || filters.priorityTier ? reviewApi.get(review.id, filters) : review))
      }
    />
  );
}
