'use client';

import { Pin } from 'lucide-react';
import type { InsightCardDto } from '@beaconvie/types';
import { Badge } from '@/components/ui/badge';
import { IconButton } from '@/components/ui/icon-button';
import { PRIORITY_BADGE_VARIANT, STATUS_BADGE_VARIANT } from '../labels';

/**
 * Phase 1/7 — the presentation-layer `InsightCard`, rendered entirely from `InsightCardDto`
 * fields the backend renderer (`insight-renderer.ts`) already produced. Never fabricates wording:
 * every string on screen is either a label the backend chose or `reason.headline`/
 * `reason.evidenceSummary`, both copied straight from the candidate's own `ruleExplanation` and a
 * deterministic evidence-count template.
 */
export function InsightCard({
  card,
  onSelect,
  onTogglePin,
  pinPending,
}: {
  card: InsightCardDto;
  onSelect: (id: string) => void;
  onTogglePin?: (card: InsightCardDto) => void;
  pinPending?: boolean;
}) {
  return (
    <li className="relative">
      <button
        type="button"
        onClick={() => onSelect(card.id)}
        className="flex w-full flex-col gap-1.5 rounded-md border border-border-subtle bg-surface p-4 pr-12 text-left transition-colors duration-fast hover:bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-insight"
      >
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="insight">{card.category.label}</Badge>
          <Badge variant={STATUS_BADGE_VARIANT[card.status.value]}>{card.status.label}</Badge>
          <Badge variant={PRIORITY_BADGE_VARIANT[card.priorityBadge.tier]}>{card.priorityBadge.label}</Badge>
        </div>
        <p className="text-body-md text-text-primary">{card.reason.headline}</p>
        <p className="text-caption text-text-disabled">
          {card.reason.evidenceSummary} · {new Date(card.windowStart).toLocaleDateString()} – {new Date(card.windowEnd).toLocaleDateString()}
        </p>
      </button>
      {onTogglePin && (
        <IconButton
          aria-label={card.pinned ? 'Unpin insight' : 'Pin insight'}
          aria-pressed={card.pinned}
          onClick={() => onTogglePin(card)}
          disabled={pinPending}
          className="absolute right-3 top-3"
        >
          <Pin className={`h-4 w-4 ${card.pinned ? 'fill-insight text-insight' : ''}`} aria-hidden="true" />
        </IconButton>
      )}
    </li>
  );
}
