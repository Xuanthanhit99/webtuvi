'use client';

import type { ReviewDetailFilters } from '../api/review-api';
import { Dropdown } from '@/components/ui/dropdown';
import { CATEGORY_LABELS } from '../labels';

const CATEGORY_OPTIONS = [{ value: '', label: 'All categories' }, ...Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label }))];

const PRIORITY_OPTIONS = [
  { value: '', label: 'All priorities' },
  { value: 'HIGH', label: 'High priority' },
  { value: 'MEDIUM', label: 'Medium priority' },
  { value: 'LOW', label: 'Low priority' },
];

/** Phase 6 — category/priority evidence filters, applied within the currently-open review (date/
 * status filters live at the list level — see `ReviewListFilterBar`). Every option maps directly
 * to a validated backend query param — no semantic filtering. */
export function ReviewFilterBar({ filters, onChange }: { filters: ReviewDetailFilters; onChange: (filters: ReviewDetailFilters) => void }) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <Dropdown
        id="review-category-filter"
        label="Category"
        value={filters.category ?? ''}
        options={CATEGORY_OPTIONS}
        onChange={(value) => onChange({ ...filters, category: value || undefined })}
        className="w-52"
      />
      <Dropdown
        id="review-priority-filter"
        label="Priority"
        value={filters.priorityTier ?? ''}
        options={PRIORITY_OPTIONS}
        onChange={(value) => onChange({ ...filters, priorityTier: (value || undefined) as ReviewDetailFilters['priorityTier'] })}
        className="w-44"
      />
    </div>
  );
}
