import Link from 'next/link';
import type { GoalEvidenceDto } from '@beaconvie/types';
import { Badge } from '@/components/ui/badge';
import { EVIDENCE_SOURCE_LABELS } from '../labels';

/** Phase 4 — every item links back to the real Memory/Journal/Reflection/Insight/Review record it
 * cites, the same deep-link rule Review/Insight Evidence already establish. */
export function GoalEvidenceList({ evidence }: { evidence: GoalEvidenceDto[] }) {
  if (evidence.length === 0) return <p className="text-body-sm text-text-secondary">No evidence gathered yet.</p>;

  return (
    <ul className="flex flex-col gap-2" aria-label="Goal evidence">
      {evidence.map((item) => (
        <li key={`${item.sourceType}:${item.sourceId}`}>
          <Link
            href={item.href}
            className="flex flex-col gap-1 rounded-md border border-border-subtle bg-surface px-3 py-2 transition-colors duration-fast hover:bg-surface-raised"
          >
            <Badge variant="neutral">{EVIDENCE_SOURCE_LABELS[item.sourceType]}</Badge>
            <p className="text-body-sm text-text-primary">{item.contribution}</p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
