'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { TuViChartDto } from '@beaconvie/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AiInterpretation } from '@/components/ui/ai-interpretation';
import { toast } from '@/components/ui/toast';
import { tuViApi } from '../api/tu-vi-api';
import { CHART_STATUS_BADGE_VARIANT, CHART_STATUS_LABELS, PALACE_ROLE_LABELS_EN, TRANSFORMATION_LABELS_EN } from '../labels';
import { TuViPalaceGrid } from './tu-vi-palace-grid';

function Section({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  const sectionId = `tu-vi-section-${title.toLowerCase().replace(/\s+/g, '-')}`;
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

/**
 * Sprint 18B.11 — a chart's full experience: deterministic facts (lá số grid, Mệnh/Thân/Cục,
 * Tứ Hóa, Tuần/Triệt — clearly labeled "Deterministic — never AI-generated", matching this
 * product's established fact-vs-AI separation discipline) above the AI interpretation, and
 * lifecycle actions. Every value rendered here is the real, already-persisted result the
 * deterministic engine (18B.1–18B.8) computed — nothing is invented client-side.
 */
export function TuViChartView({ chart, onChanged }: { chart: TuViChartDto; onChanged?: () => void }) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['tu-vi'] });
    onChanged?.();
  };

  const retryInterpretation = useMutation({
    mutationFn: () => tuViApi.retryInterpretation(chart.id),
    onSuccess: invalidate,
    onError: () => toast.error("Couldn't generate an interpretation. Please try again."),
  });
  const archive = useMutation({
    mutationFn: () => tuViApi.archiveChart(chart.id),
    onSuccess: () => {
      invalidate();
      toast.success('Lá số archived.');
    },
    onError: () => toast.error("Couldn't archive that lá số."),
  });
  const restore = useMutation({
    mutationFn: () => tuViApi.restoreChart(chart.id),
    onSuccess: () => {
      invalidate();
      toast.success('Lá số restored.');
    },
    onError: () => toast.error("Couldn't restore that lá số."),
  });
  const remove = useMutation({
    mutationFn: () => tuViApi.deleteChart(chart.id),
    onSuccess: () => {
      invalidate();
      toast.success('Lá số deleted.');
    },
    onError: () => toast.error("Couldn't delete that lá số."),
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border-subtle bg-surface p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={CHART_STATUS_BADGE_VARIANT[chart.status]}>{CHART_STATUS_LABELS[chart.status]}</Badge>
          <span className="text-caption text-text-secondary">
            Born {chart.birthDate} at {chart.birthTime} · <span className="text-text-primary">{chart.sex}</span>
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

      <div className="flex items-center justify-between gap-3">
        <p className="text-caption text-text-tertiary">Được tính toán từ dữ liệu sinh — calculated from your birth data, never chosen by AI.</p>
        <Badge variant="new">Deterministic — never AI-generated</Badge>
      </div>

      <div className="grid gap-4 desktop:grid-cols-[minmax(0,1.35fr)_320px]">
        <div className="rounded-lg border border-[rgba(213,173,98,0.16)] bg-surface p-3 tablet:p-4">
          <TuViPalaceGrid chart={chart} />
        </div>

        <div className="space-y-3 rounded-lg border border-border-subtle bg-surface p-4">
          <p className="text-caption font-semibold uppercase tracking-[0.16em] text-insight">Tổng quan lá số</p>
          <dl className="grid grid-cols-2 gap-2 text-body-sm">
            <dt className="text-text-secondary">Mệnh</dt>
            <dd className="text-text-primary">{chart.palaces.menh}</dd>
            <dt className="text-text-secondary">Thân</dt>
            <dd className="text-text-primary">{chart.palaces.than}</dd>
            <dt className="text-text-secondary">Cục</dt>
            <dd className="text-text-primary">{chart.cuc}</dd>
            <dt className="text-text-secondary">Can Chi năm</dt>
            <dd className="text-text-primary">
              {chart.canChi.year.stem} {chart.canChi.year.branch}
            </dd>
            <dt className="text-text-secondary">Giờ sinh</dt>
            <dd className="text-text-primary">{chart.hourBranch}</dd>
          </dl>
        </div>
      </div>

      <Section title="Tứ Hóa (Four Transformations)">
        <ul className="flex flex-col gap-1.5 text-body-sm">
          {chart.transformations.map((t) => (
            <li key={t.transformation} className="flex items-center justify-between gap-2">
              <span className="text-text-primary">
                {t.transformation} <span className="text-text-tertiary">({TRANSFORMATION_LABELS_EN[t.transformation] ?? t.transformation})</span>
              </span>
              <span className="text-text-secondary">
                {t.targetStar} @ {t.position}
              </span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Tuần / Triệt (Void palaces)">
        <dl className="grid grid-cols-2 gap-2 text-body-sm">
          <dt className="text-text-secondary">Tuần</dt>
          <dd className="text-text-primary">
            {chart.tuan.first}, {chart.tuan.second}
          </dd>
          <dt className="text-text-secondary">Triệt</dt>
          <dd className="text-text-primary">
            {chart.triet.first}, {chart.triet.second}
          </dd>
        </dl>
      </Section>

      <AiInterpretation interpretation={chart.interpretation} isGenerating={retryInterpretation.isPending} onGenerate={() => retryInterpretation.mutate()} />

      <Section title="Calculation details">
        <dl className="grid grid-cols-2 gap-2 text-body-sm">
          <dt className="text-text-secondary">Engine version</dt>
          <dd className="text-text-primary">{chart.versions.engineVersion}</dd>
          <dt className="text-text-secondary">Ruleset version</dt>
          <dd className="text-text-primary">{chart.versions.rulesetVersion}</dd>
          <dt className="text-text-secondary">Main star version</dt>
          <dd className="text-text-primary">{chart.versions.mainStarVersion}</dd>
          <dt className="text-text-secondary">Auxiliary star version</dt>
          <dd className="text-text-primary">{chart.versions.auxiliaryVersion}</dd>
        </dl>
      </Section>

      <Section title="All 12 palace roles (reference)">
        <ul className="grid grid-cols-1 gap-1 text-body-sm tablet:grid-cols-2">
          {Object.entries(PALACE_ROLE_LABELS_EN).map(([role, en]) => (
            <li key={role} className="text-text-secondary">
              <span className="text-text-primary">{role}</span> — {en}
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
