'use client';

import type { GoalCategoryValue, GoalStatusValue } from '@beaconvie/types';
import { Dropdown } from '@/components/ui/dropdown';
import { CATEGORY_LABELS, STATUS_LABELS } from '../labels';

export interface GoalListFilters {
  status?: GoalStatusValue;
  category?: GoalCategoryValue;
}

const STATUS_OPTIONS = [{ value: '', label: 'All statuses' }, ...Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }))];
const CATEGORY_OPTIONS = [{ value: '', label: 'All categories' }, ...Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label }))];

/** Phase 6 — list-level date/category/status filters (a Goal has no meaningful date-range filter
 * of its own the way a Review does — `targetDate` is a single field, not a window). */
export function GoalFilterBar({ filters, onChange }: { filters: GoalListFilters; onChange: (filters: GoalListFilters) => void }) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <Dropdown
        id="goal-status-filter"
        label="Status"
        value={filters.status ?? ''}
        options={STATUS_OPTIONS}
        onChange={(value) => onChange({ ...filters, status: (value || undefined) as GoalStatusValue | undefined })}
        className="w-44"
      />
      <Dropdown
        id="goal-category-filter"
        label="Category"
        value={filters.category ?? ''}
        options={CATEGORY_OPTIONS}
        onChange={(value) => onChange({ ...filters, category: (value || undefined) as GoalCategoryValue | undefined })}
        className="w-52"
      />
    </div>
  );
}
