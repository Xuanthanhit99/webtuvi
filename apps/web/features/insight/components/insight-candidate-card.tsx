'use client';

import type { InsightCandidateDto } from '@beaconvie/types';
import { Badge } from '@/components/ui/badge';
import { CATEGORY_LABELS, STATUS_LABELS } from '../labels';

export function InsightCandidateCard({ candidate, onSelect }: { candidate: InsightCandidateDto; onSelect: (id: string) => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(candidate.id)}
        className="flex w-full flex-col gap-1.5 rounded-md border border-border-subtle bg-surface p-4 text-left transition-colors duration-fast hover:bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-insight"
      >
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="insight">{CATEGORY_LABELS[candidate.category]}</Badge>
          <Badge variant={candidate.status === 'READY' ? 'new' : 'neutral'}>{STATUS_LABELS[candidate.status]}</Badge>
          <Badge variant="neutral">Priority {candidate.priority}</Badge>
        </div>
        <p className="text-body-md text-text-primary">{candidate.ruleExplanation}</p>
        <p className="text-caption text-text-disabled">
          {candidate.evidence.length} evidence · {candidate.relationships.length} relationship{candidate.relationships.length === 1 ? '' : 's'} ·{' '}
          {new Date(candidate.windowStart).toLocaleDateString()} – {new Date(candidate.windowEnd).toLocaleDateString()}
        </p>
      </button>
    </li>
  );
}
