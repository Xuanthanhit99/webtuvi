'use client';

import type { ReviewSectionDto } from '@beaconvie/types';
import { ReviewEvidenceList } from './review-evidence-list';
import { EmptyState } from '@/components/ui/empty-state';

/** Phase 2/4 — Overview/Highlights/Changes/Achievements/Challenges render here as real, non-empty
 * sections only (a section with no qualifying evidence is never created — see
 * review-builder.util.ts). */
export function ReviewSectionList({ sections }: { sections: ReviewSectionDto[] }) {
  if (sections.length === 0) {
    return (
      <EmptyState
        title="Nothing to show for this period yet"
        description="As reflections and insights build up during this period, they'll appear here."
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {sections.map((section) => (
        <section key={section.type} aria-labelledby={`review-section-${section.type}`}>
          <h3 id={`review-section-${section.type}`} className="mb-1 font-display text-heading-sm text-text-primary">
            {section.title}
          </h3>
          <p className="mb-2 text-body-sm text-text-secondary">{section.summary}</p>
          <ReviewEvidenceList evidence={section.evidence} />
        </section>
      ))}
    </div>
  );
}
