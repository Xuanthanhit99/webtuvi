'use client';

import type { ReflectionCandidateDto } from '@beaconvie/types';
import { Badge } from '@/components/ui/badge';
import { CATEGORY_LABELS } from '../labels';

export function ReflectionCandidateCard({ candidate, onSelect }: { candidate: ReflectionCandidateDto; onSelect: (id: string) => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(candidate.id)}
        className="flex w-full flex-col gap-1.5 rounded-md border border-border-subtle bg-surface p-4 text-left transition-colors duration-fast hover:bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-insight"
      >
        <div className="flex flex-wrap items-center gap-2">
          {candidate.pinned && <Badge variant="new">Pinned</Badge>}
          <Badge variant="insight">{CATEGORY_LABELS[candidate.category]}</Badge>
          <Badge variant="neutral">Score {candidate.score}</Badge>
        </div>
        <p className="text-body-md text-text-primary">{candidate.reason}</p>
        <p className="text-caption text-text-disabled">
          {candidate.sources.length} source{candidate.sources.length === 1 ? '' : 's'} · {new Date(candidate.createdAt).toLocaleDateString()}
        </p>
      </button>
    </li>
  );
}
