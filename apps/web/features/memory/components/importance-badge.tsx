'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';

export interface ImportanceBadgeProps {
  score?: number;
  explanations?: string[];
  pinned?: boolean;
}

function tierFor(score: number): { label: string; variant: 'insight' | 'new' | 'neutral' } {
  if (score >= 70) return { label: 'Important', variant: 'insight' };
  if (score >= 40) return { label: 'Notable', variant: 'new' };
  return { label: 'Background', variant: 'neutral' };
}

/**
 * Never shows the raw 0-100 importance score without its explanation alongside it (Sprint 3B
 * Phase 10 requirement) — the badge itself shows a plain-language tier, and the score number
 * only appears inside the expanded "Why?" panel, next to the reasons that produced it.
 */
export function ImportanceBadge({ score = 0, explanations = [], pinned = false }: ImportanceBadgeProps) {
  const [expanded, setExpanded] = useState(false);
  const tier = tierFor(score);

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <div className="flex items-center gap-1.5">
        {pinned && <Badge variant="new">Pinned</Badge>}
        <Badge variant={tier.variant}>{tier.label}</Badge>
        <button
          type="button"
          onClick={(e) => {
            // ImportanceBadge is often nested inside a clickable Card (timeline/recommendation
            // rows) — stop the toggle from also triggering the card's own onClick/onSelect.
            e.stopPropagation();
            setExpanded((v) => !v);
          }}
          className="text-caption text-text-disabled underline decoration-dotted hover:text-text-secondary"
          aria-expanded={expanded}
        >
          Why?
        </button>
      </div>
      {expanded && (
        <div className="rounded-sm bg-surface-raised px-2 py-1.5 text-caption text-text-secondary">
          <p className="mb-1 font-medium text-text-primary">Importance: {score}/100</p>
          {explanations.length > 0 ? (
            <ul className="list-inside list-disc">
              {explanations.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          ) : (
            <p>No specific factors yet — this is a baseline score.</p>
          )}
        </div>
      )}
    </div>
  );
}
