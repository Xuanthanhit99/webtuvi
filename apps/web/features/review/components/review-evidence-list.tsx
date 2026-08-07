'use client';

import Link from 'next/link';
import type { ReviewEvidenceDto } from '@beaconvie/types';
import { Badge } from '@/components/ui/badge';
import { CATEGORY_LABELS, PRIORITY_BADGE_VARIANT, priorityTierFor } from '../labels';

/** Phase 4 — Review Evidence. Every item links back to the real Insight/Reflection/Journal/Memory
 * record it cites (Phase 8 "never fabricate evidence") — the same deep-link rule Insight
 * Experience's own Evidence View already established, reused verbatim so wording/linking never
 * drifts between the two surfaces. */
export function ReviewEvidenceList({ evidence }: { evidence: ReviewEvidenceDto[] }) {
  if (evidence.length === 0) return null;

  return (
    <ul className="flex flex-col gap-2" aria-label="Section evidence">
      {evidence.map((item) => {
        const tier = priorityTierFor(item.priority);
        return (
          <li key={`${item.sourceType}:${item.sourceId}`}>
            <Link
              href={item.href}
              className="flex flex-col gap-1 rounded-md border border-border-subtle bg-surface px-3 py-2 transition-colors duration-fast hover:bg-surface-raised"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="neutral">{item.sourceType}</Badge>
                <Badge variant="insight">{CATEGORY_LABELS[item.category] ?? item.category}</Badge>
                <Badge variant={PRIORITY_BADGE_VARIANT[tier]}>{tier === 'HIGH' ? 'High' : tier === 'MEDIUM' ? 'Medium' : 'Low'} priority</Badge>
              </div>
              <p className="text-body-sm text-text-primary">{item.contribution}</p>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
