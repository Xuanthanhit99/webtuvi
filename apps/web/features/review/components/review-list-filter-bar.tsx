'use client';

import type { ListReviewsFilters } from '../api/review-api';
import { Dropdown } from '@/components/ui/dropdown';

const WINDOW_OPTIONS = [
  { value: '', label: 'All windows' },
  { value: 'WEEK', label: 'Weekly' },
  { value: 'MONTH', label: 'Monthly' },
  { value: 'CUSTOM', label: 'Custom' },
];

const STATE_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'READY', label: 'Ready' },
  { value: 'NOT_READY', label: 'Not ready' },
  { value: 'ARCHIVED', label: 'Archived' },
];

/** Phase 6 — the list-level filters: window, status, and date (on windowStart). */
export function ReviewListFilterBar({ filters, onChange }: { filters: ListReviewsFilters; onChange: (filters: ListReviewsFilters) => void }) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <Dropdown
        id="review-list-window"
        label="Window"
        value={filters.window ?? ''}
        options={WINDOW_OPTIONS}
        onChange={(value) => onChange({ ...filters, window: (value || undefined) as ListReviewsFilters['window'] })}
        className="w-40"
      />
      <Dropdown
        id="review-list-state"
        label="Status"
        value={filters.state ?? ''}
        options={STATE_OPTIONS}
        onChange={(value) => onChange({ ...filters, state: (value || undefined) as ListReviewsFilters['state'] })}
        className="w-44"
      />
      <label className="flex flex-col gap-1 text-body-sm text-text-secondary">
        From
        <input
          type="date"
          value={filters.from ? filters.from.slice(0, 10) : ''}
          onChange={(e) => onChange({ ...filters, from: e.target.value || undefined })}
          className="h-11 rounded-md border border-border-subtle bg-surface px-3 text-body-md text-text-primary"
        />
      </label>
      <label className="flex flex-col gap-1 text-body-sm text-text-secondary">
        To
        <input
          type="date"
          value={filters.to ? filters.to.slice(0, 10) : ''}
          onChange={(e) => onChange({ ...filters, to: e.target.value || undefined })}
          className="h-11 rounded-md border border-border-subtle bg-surface px-3 text-body-md text-text-primary"
        />
      </label>
    </div>
  );
}
