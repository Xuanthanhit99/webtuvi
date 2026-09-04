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
    <article className="flex min-w-0 flex-col gap-3 rounded-lg border border-[#b78ad0]/16 bg-[#0d1120]/80 p-4 transition-colors hover:border-[#b78ad0]/32">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-body-sm font-semibold text-text-secondary">{VALUE_TYPE_LABELS[entry.type]}</p>
          <p className="text-caption text-text-secondary">{VALUE_TYPE_DESCRIPTIONS[entry.type]}</p>
        </div>
        {entry.appliesToYear && <Badge variant="neutral">{entry.appliesToYear}</Badge>}
      </div>

      <div className="flex items-center gap-3">
        <span className="font-serif text-[2.5rem] leading-none text-[#f1d69d]">{entry.value}</span>
        {entry.isMasterNumber && <Badge variant="insight">Số đặc biệt</Badge>}
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
        className="flex min-h-11 w-fit items-center gap-1 text-body-sm text-[#c39cdb] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-insight"
      >
        <ChevronDown className={`h-4 w-4 transition-transform duration-fast ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" />
        {expanded ? 'Ẩn cách tính' : `Vì sao là số ${entry.value}?`}
      </button>

      {expanded && (
        <ol id={detailId} className="flex min-w-0 flex-col gap-1 break-words rounded-md border border-[#b78ad0]/15 bg-[#080b17] p-3 text-body-sm text-text-secondary">
          {steps.map((step, index) => (
            <li key={index}>{step}</li>
          ))}
        </ol>
      )}
    </article>
  );
}
