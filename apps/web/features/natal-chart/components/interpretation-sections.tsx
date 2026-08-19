'use client';

import { useState } from 'react';
import { ChevronDown, Sparkles } from 'lucide-react';
import type { NatalChartInterpretationSectionsDto } from '@beaconvie/types';
import { Button } from '@/components/ui/button';
import { INTERPRETATION_SECTION_LABELS, INTERPRETATION_SECTION_ORDER } from '../labels';

/**
 * Phase 11/18 — the ten independently-renderable AI interpretation sections. Shares
 * `AiInterpretation`'s visual language (Sparkles icon, insight-tinted border, explicit "written
 * by AI" caption — Sprint 8.5's AI-visibility fix) but structured into named sections rather
 * than one blended paragraph, and defaults to only the Overview expanded so a first-time viewer
 * isn't confronted with all ten at once (Module 13 §4's progressive-disclosure principle).
 */
export function InterpretationSections({
  interpretation,
  isGenerating,
  onGenerate,
}: {
  interpretation: NatalChartInterpretationSectionsDto | null;
  isGenerating: boolean;
  onGenerate: () => void;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['overview']));

  function toggle(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div className="rounded-md border border-insight/20 bg-insight/5 p-3">
      <div className="mb-2 flex items-center gap-1.5 text-caption font-medium uppercase tracking-wide text-insight">
        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
        AI Interpretation
      </div>

      {interpretation ? (
        <div className="flex flex-col gap-1.5">
          {INTERPRETATION_SECTION_ORDER.map((key) => {
            const isOpen = expanded.has(key);
            const sectionId = `natal-chart-interpretation-${key}`;
            return (
              <div key={key} className="rounded-md bg-surface">
                <button
                  type="button"
                  onClick={() => toggle(key)}
                  aria-expanded={isOpen}
                  aria-controls={sectionId}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-body-sm font-semibold text-text-primary"
                >
                  {INTERPRETATION_SECTION_LABELS[key]}
                  <ChevronDown className={`h-4 w-4 shrink-0 transition-transform duration-fast ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                </button>
                {isOpen && (
                  <p id={sectionId} className="px-3 pb-3 text-body-sm text-text-secondary">
                    {interpretation[key]}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <p className="text-body-sm text-text-secondary">{isGenerating ? 'Writing your interpretation…' : 'Interpretation isn’t ready yet.'}</p>
          <Button variant="secondary" size="sm" onClick={onGenerate} loading={isGenerating}>
            Generate interpretation
          </Button>
        </div>
      )}

      <p className="mt-2 text-caption text-text-tertiary">Written by AI to narrate the chart above — it never changes a calculated placement.</p>
    </div>
  );
}
