'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { NumerologyMeaningDto, NumerologyValueDto } from '@beaconvie/types';
import { Badge } from '@/components/ui/badge';
import { breakdownSteps } from '../breakdown-text';
import { VALUE_TYPE_DESCRIPTIONS, VALUE_TYPE_LABELS } from '../labels';

export function NumerologyValueCard({ entry, meaning }: { entry: NumerologyValueDto; meaning: NumerologyMeaningDto | undefined }) {
  const [expanded, setExpanded] = useState(false);
  const steps = breakdownSteps(entry);
  const detailId = `numerology-value-${entry.type}-steps`;

  return (
    <article data-numerology-value={entry.type} className="flex min-w-0 flex-col rounded-xl border border-[#b78ad0]/16 bg-[#0d1120]/80 p-4 tablet:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-caption font-semibold uppercase tracking-[0.14em] text-[#c39cdb]">{VALUE_TYPE_LABELS[entry.type]}</p>
          <p className="mt-1 text-body-sm leading-relaxed text-text-secondary">{VALUE_TYPE_DESCRIPTIONS[entry.type]}</p>
        </div>
        {entry.appliesToYear && <Badge variant="neutral">{entry.appliesToYear}</Badge>}
      </div>
      <div className="mt-4 flex items-end gap-3 border-b border-[#b78ad0]/12 pb-4">
        <span className="font-serif text-[3rem] leading-none text-[#f1d69d]">{entry.value}</span>
        {entry.isMasterNumber && <Badge variant="insight" className="mb-1">Số đặc biệt</Badge>}
      </div>
      {meaning && <div className="mt-4"><p className="font-serif text-body-md font-semibold text-text-primary">{meaning.title}.</p><p className="mt-1 text-body-sm leading-relaxed text-text-secondary">{meaning.meaning}</p></div>}
      <button type="button" onClick={() => setExpanded((v) => !v)} aria-expanded={expanded} aria-controls={detailId} className="mt-4 flex min-h-11 w-fit items-center gap-1 text-body-sm font-medium text-[#c39cdb] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-insight">
        <ChevronDown className={`h-4 w-4 transition-transform duration-fast ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" />
        {expanded ? 'Ẩn cách tính' : `Vì sao là số ${entry.value}?`}
      </button>
      {expanded && <ol id={detailId} className="mt-2 flex min-w-0 flex-col gap-1 break-words rounded-md border border-[#b78ad0]/15 bg-[#080b17] p-3 text-body-sm text-text-secondary">{steps.map((step, index) => <li key={index}>{step}</li>)}</ol>}
    </article>
  );
}
