'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { NumerologyMeaningDto, NumerologyValueDto } from '@beaconvie/types';
import { Badge } from '@/components/ui/badge';
import { breakdownSteps } from '../breakdown-text';
import { VALUE_TYPE_DESCRIPTIONS, VALUE_TYPE_LABELS } from '../labels';

/** Phase 12/13 — one core number: the real calculated value, its traditional meaning (static
 * reference data, never AI-generated), and an expandable "why is my number X" steps trail. */
export function NumerologyValueCard({ entry, meaning }: { entry: NumerologyValueDto; meaning: NumerologyMeaningDto | undefined }) {
  const [expanded, setExpanded] = useState(false);
  const steps = breakdownSteps(entry);
  const detailId = `numerology-value-${entry.type}-steps`;

  return (
    <div className="flex flex-col gap-3 rounded-md border border-border-subtle bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-body-sm font-semibold text-text-secondary">{VALUE_TYPE_LABELS[entry.type]}</p>
          <p className="text-caption text-text-secondary">{VALUE_TYPE_DESCRIPTIONS[entry.type]}</p>
        </div>
        {entry.appliesToYear && <Badge variant="neutral">{entry.appliesToYear}</Badge>}
      </div>

      <div className="flex items-center gap-3">
        <span className="font-mono text-heading-lg text-text-primary">{entry.value}</span>
        {entry.isMasterNumber && <Badge variant="insight">Master Number</Badge>}
      </div>

      {meaning && (
        <p className="text-body-sm text-text-primary">
          <span className="font-semibold">{meaning.title}.</span> {meaning.meaning}
        </p>
      )}

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-controls={detailId}
        className="flex w-fit items-center gap-1 text-body-sm text-insight hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-insight"
      >
        <ChevronDown className={`h-4 w-4 transition-transform duration-fast ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" />
        {expanded ? 'Hide calculation' : `Why is my number ${entry.value}?`}
      </button>

      {expanded && (
        <ol id={detailId} className="flex flex-col gap-1 rounded-md bg-surface-raised p-3 text-body-sm text-text-secondary">
          {steps.map((step, index) => (
            <li key={index}>{step}</li>
          ))}
        </ol>
      )}
    </div>
  );
}
