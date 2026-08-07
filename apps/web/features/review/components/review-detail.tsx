'use client';

import { reviewApi } from '../api/review-api';
import { ReviewContent } from './review-content';
import { Button } from '@/components/ui/button';

/** `/reviews/:id` — a specific review by id (permalink), including archived ones. */
export function ReviewDetail({ id, onClose }: { id: string; onClose?: () => void }) {
  return (
    <div className="flex flex-col gap-4">
      {onClose && (
        <Button variant="ghost" size="sm" onClick={onClose} className="self-start">
          Back
        </Button>
      )}
      <ReviewContent queryKey={['reviews', id]} fetcher={(filters) => reviewApi.get(id, filters)} onArchived={onClose} />
    </div>
  );
}
