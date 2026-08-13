'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { NatalChartDto } from '@beaconvie/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { natalChartApi } from '../api/natal-chart-api';
import { CHART_STATUS_BADGE_VARIANT, CHART_STATUS_LABELS } from '../labels';
import { NatalChartWheel } from './natal-chart-wheel';
import { BigThreeSummary } from './big-three-summary';
import { PlanetList } from './planet-list';
import { HouseList } from './house-list';
import { AspectList } from './aspect-list';
import { InterpretationSections } from './interpretation-sections';

function Section({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  const sectionId = `natal-chart-section-${title.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <section aria-labelledby={`${sectionId}-heading`}>
      <button
        type="button"
        id={`${sectionId}-heading`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={sectionId}
        className="flex w-full items-center justify-between gap-2 py-2 text-left text-body-sm font-semibold text-text-secondary"
      >
        {title}
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform duration-fast ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {open && (
        <div id={sectionId} className="pb-2">
          {children}
        </div>
      )}
    </section>
  );
}

/** Phase 15/17/18 — a chart's full experience: calculated facts (wheel, Big Three, planets,
 * houses, aspects — clearly labeled "calculated from your birth data", Sprint 8.5's AI-labeling
 * discipline) above the AI interpretation, and lifecycle actions. Every calculated value rendered
 * here is the real, already-persisted result the backend computed — nothing is invented
 * client-side (mirrors NumerologyReadingView's own precedent). */
export function NatalChartView({ chart, onChanged }: { chart: NatalChartDto; onChanged?: () => void }) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['natal-chart'] });
    onChanged?.();
  };

  const retryInterpretation = useMutation({
    mutationFn: () => natalChartApi.retryInterpretation(chart.id),
    onSuccess: invalidate,
    onError: () => toast.error("Couldn't generate an interpretation. Please try again."),
  });
  const archive = useMutation({
    mutationFn: () => natalChartApi.archiveChart(chart.id),
    onSuccess: () => {
      invalidate();
      toast.success('Chart archived.');
    },
    onError: () => toast.error("Couldn't archive that chart."),
  });
  const restore = useMutation({
    mutationFn: () => natalChartApi.restoreChart(chart.id),
    onSuccess: () => {
      invalidate();
      toast.success('Chart restored.');
    },
    onError: () => toast.error("Couldn't restore that chart."),
  });
  const remove = useMutation({
    mutationFn: () => natalChartApi.deleteChart(chart.id),
    onSuccess: () => {
      invalidate();
      toast.success('Chart deleted.');
    },
    onError: () => toast.error("Couldn't delete that chart."),
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border-subtle bg-surface p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={CHART_STATUS_BADGE_VARIANT[chart.status]}>{CHART_STATUS_LABELS[chart.status]}</Badge>
          <span className="text-caption text-text-secondary">
            Born {chart.birthDate}
            {chart.birthTime ? ` at ${chart.birthTime}` : ' (time unknown)'} · <span className="text-text-primary">{chart.birthPlaceLabel}</span>
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {chart.status === 'ACTIVE' && (
            <Button variant="ghost" size="sm" onClick={() => archive.mutate()} loading={archive.isPending}>
              Archive
            </Button>
          )}
          {chart.status !== 'ACTIVE' && (
            <Button variant="secondary" size="sm" onClick={() => restore.mutate()} loading={restore.isPending}>
              Restore
            </Button>
          )}
          {chart.status !== 'DELETED' && (
            <Button variant="ghost" size="sm" onClick={() => remove.mutate()} loading={remove.isPending}>
              Delete
            </Button>
          )}
        </div>
      </div>

      <p className="text-caption text-text-disabled">Được tính toán từ dữ liệu sinh — calculated from your birth data, never chosen by AI.</p>

      <NatalChartWheel chart={chart} />
      <BigThreeSummary chart={chart} />

      <Section title="Planets" defaultOpen>
        <PlanetList placements={chart.placements} />
      </Section>

      <Section title="Houses">
        <HouseList chart={chart} />
      </Section>

      <Section title="Key Aspects">
        <AspectList aspects={chart.aspects} />
      </Section>

      <InterpretationSections interpretation={chart.interpretation} isGenerating={retryInterpretation.isPending} onGenerate={() => retryInterpretation.mutate()} />

      <Section title="Calculation details">
        <dl className="grid grid-cols-2 gap-2 text-body-sm">
          <dt className="text-text-secondary">Zodiac</dt>
          <dd className="text-text-primary">{chart.zodiacMode}</dd>
          <dt className="text-text-secondary">House system</dt>
          <dd className="text-text-primary">{chart.houseSystem}</dd>
          <dt className="text-text-secondary">Timezone</dt>
          <dd className="text-text-primary">{chart.timezone}</dd>
          <dt className="text-text-secondary">Calculation version</dt>
          <dd className="text-text-primary">{chart.calculationVersion}</dd>
        </dl>
      </Section>
    </div>
  );
}
