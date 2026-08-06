'use client';

import type { InsightCardFilters } from '../api/insight-api';
import { Dropdown } from '@/components/ui/dropdown';
import { CATEGORY_LABELS } from '../labels';

const CATEGORY_OPTIONS = [{ value: '', label: 'All categories' }, ...Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label }))];

const PRIORITY_OPTIONS = [
  { value: '', label: 'All priorities' },
  { value: 'HIGH', label: 'High priority' },
  { value: 'MEDIUM', label: 'Medium priority' },
  { value: 'LOW', label: 'Low priority' },
];

const SOURCE_OPTIONS = [
  { value: '', label: 'Any source' },
  { value: 'JOURNAL', label: 'Journal entry' },
  { value: 'MEMORY', label: 'Memory' },
  { value: 'ACTIVITY', label: 'Activity' },
  { value: 'COMPANION', label: 'Companion conversation' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'READY', label: 'Ready' },
  { value: 'NOT_READY', label: 'Not ready' },
  { value: 'INSUFFICIENT_EVIDENCE', label: 'Insufficient evidence' },
];

/** Phase 6 — priority / category / date / status / source filters, no semantic filtering. Each
 * control maps straight to a query param the backend already validates (`ListInsightCardsQueryDto`)
 * — nothing here re-interprets or fuzzy-matches a value. */
export function InsightFilterBar({
  filters,
  onChange,
  showStatus = true,
  idPrefix,
}: {
  filters: InsightCardFilters;
  onChange: (filters: InsightCardFilters) => void;
  showStatus?: boolean;
  idPrefix: string;
}) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <Dropdown
        id={`${idPrefix}-category`}
        label="Category"
        value={filters.category ?? ''}
        options={CATEGORY_OPTIONS}
        onChange={(value) => onChange({ ...filters, category: (value || undefined) as InsightCardFilters['category'] })}
        className="w-48"
      />
      <Dropdown
        id={`${idPrefix}-priority`}
        label="Priority"
        value={filters.priorityTier ?? ''}
        options={PRIORITY_OPTIONS}
        onChange={(value) => onChange({ ...filters, priorityTier: (value || undefined) as InsightCardFilters['priorityTier'] })}
        className="w-44"
      />
      <Dropdown
        id={`${idPrefix}-source`}
        label="Source"
        value={filters.source ?? ''}
        options={SOURCE_OPTIONS}
        onChange={(value) => onChange({ ...filters, source: (value || undefined) as InsightCardFilters['source'] })}
        className="w-52"
      />
      {showStatus && (
        <Dropdown
          id={`${idPrefix}-status`}
          label="Status"
          value={filters.status ?? ''}
          options={STATUS_OPTIONS}
          onChange={(value) => onChange({ ...filters, status: (value || undefined) as InsightCardFilters['status'] })}
          className="w-48"
        />
      )}
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
