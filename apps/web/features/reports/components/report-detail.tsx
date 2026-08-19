'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import type { ReportDto, ReportNarrativeSectionDto, ReportTitledSectionDto } from '@beaconvie/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { toast } from '@/components/ui/toast';
import { usePremiumStatus } from '@/features/premium/hooks/use-premium-status';
import { useTrackEvent } from '@/hooks/use-track-event';
import { ApiError } from '@/lib/api-error';
import { reportsApi } from '../api/reports-api';
import { REPORT_FAILURE_REASON_MESSAGES } from '../labels';

// Accessibility + Product Polish (2026-08-19): matches the existing polling convention already
// used for another async-generation status (premium-return-status.tsx's PENDING order polling).
const GENERATING_POLL_INTERVAL_MS = 2000;

const SECTIONS: { id: string; heading: string }[] = [
  { id: 'overview', heading: 'Overview' },
  { id: 'core-identity', heading: 'Core Identity' },
  { id: 'strengths', heading: 'Strengths' },
  { id: 'growth-areas', heading: 'Growth Tendencies' },
  { id: 'relationships', heading: 'Relationships' },
  { id: 'career-direction', heading: 'Career & Direction' },
  { id: 'current-themes', heading: 'Current Themes' },
  { id: 'personalized-reflection', heading: 'Personalized Reflection' },
  { id: 'source-highlights', heading: 'Source Highlights' },
  { id: 'calculated-facts', heading: 'Calculated Facts' },
  { id: 'methodology', heading: 'Methodology & AI Disclosure' },
];

export function ReportDetail({ id, onClose, onRegenerated }: { id: string; onClose: () => void; onRegenerated: (id: string) => void }) {
  // Accessibility + Product Polish (2026-08-19): a report opened while still GENERATING (a
  // bookmark, a shared link, or a second tab — not the primary generate-button flow, which already
  // blocks synchronously until the real status is known) previously showed a static card forever,
  // with no way to discover completion short of a manual reload.
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['reports', id],
    queryFn: () => reportsApi.getReport(id),
    refetchInterval: (query) => (query.state.data?.status === 'GENERATING' ? GENERATING_POLL_INTERVAL_MS : false),
  });

  return (
    <div className="flex flex-col gap-4">
      <Button variant="ghost" size="sm" onClick={onClose}>
        ← Back to Reports
      </Button>
      {isLoading && <Skeleton className="h-64 w-full" />}
      {isError && <ErrorState description="Couldn't load that report." onRetry={() => refetch()} />}
      {data && <ReportView report={data} onRegenerated={onRegenerated} />}
    </div>
  );
}

function ReportView({ report, onRegenerated }: { report: ReportDto; onRegenerated: (id: string) => void }) {
  useTrackEvent('report_viewed', { feature: 'reports' });
  const queryClient = useQueryClient();
  const { data: premiumStatus } = usePremiumStatus();

  const regenerate = useMutation({
    mutationFn: () => reportsApi.regenerate(report.id),
    onSuccess: (newReport) => {
      void queryClient.invalidateQueries({ queryKey: ['reports', 'list'] });
      onRegenerated(newReport.id);
    },
    onError: (error) => {
      const message = error instanceof ApiError ? error.message : "Couldn't regenerate your report. Please try again.";
      toast.error(message);
    },
  });

  if (report.status === 'GENERATING') {
    return (
      <Card className="flex flex-col items-center gap-3 py-10 text-center" role="status">
        <Skeleton className="h-6 w-48" />
        <p className="text-body-sm text-text-secondary">Connecting a few things you&rsquo;ve shared…</p>
      </Card>
    );
  }

  if (report.status === 'FAILED') {
    return (
      <ErrorState
        title="This report couldn’t be generated"
        description={report.failureReason ? REPORT_FAILURE_REASON_MESSAGES[report.failureReason] : undefined}
        onRetry={() => regenerate.mutate()}
        retryLabel={regenerate.isPending ? 'Trying again…' : 'Try again'}
      />
    );
  }

  const result = report.result;
  if (!result) return null;

  return (
    <div className="flex gap-6">
      <ReportTableOfContents hasCurrentThemes={!!result.currentThemes} hasPersonalizedReflection={!!result.personalizedReflection} />
      <article className="mx-auto flex max-w-[720px] flex-1 flex-col gap-8">
        <header className="flex flex-col gap-1">
          <h1 className="font-display text-heading-lg text-text-primary">Personal Destiny Report</h1>
          <p className="text-caption text-text-secondary">Generated {new Date(report.createdAt).toLocaleDateString()}</p>
        </header>

        <section id="overview" aria-labelledby="overview-heading" className="flex flex-col gap-2">
          <SectionHeading id="overview-heading">Overview</SectionHeading>
          <p className="text-body-md text-text-primary">{result.overview}</p>
        </section>

        <NarrativeSection id="core-identity" heading="Core Identity" section={result.coreIdentity} />

        <TitledSectionGroup id="strengths" heading="Strengths" items={result.strengths} />

        <TitledSectionGroup id="growth-areas" heading="Growth Tendencies" items={result.growthAreas} />

        <NarrativeSection id="relationships" heading="Relationships" section={result.relationships} />

        <NarrativeSection id="career-direction" heading="Career & Direction" section={result.careerDirection} />

        {result.currentThemes && <NarrativeSection id="current-themes" heading="Current Themes" section={result.currentThemes} badge="From recent Tarot context" />}

        {result.personalizedReflection && (
          <NarrativeSection id="personalized-reflection" heading="Personalized Reflection" section={result.personalizedReflection} badge="From your Memory" />
        )}

        <section id="source-highlights" aria-labelledby="source-highlights-heading" className="flex flex-col gap-2">
          <SectionHeading id="source-highlights-heading">Source Highlights</SectionHeading>
          <ul className="flex flex-col gap-1.5">
            {result.sourceHighlights.map((highlight, i) => (
              <li key={i} className="text-body-sm text-text-secondary">
                <span className="font-semibold text-text-primary">{highlight.source}:</span> {highlight.fact}
              </li>
            ))}
          </ul>
        </section>

        <section id="calculated-facts" aria-labelledby="calculated-facts-heading" className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <SectionHeading id="calculated-facts-heading">Calculated Facts</SectionHeading>
            <Badge variant="neutral">Deterministic — never AI-generated</Badge>
          </div>
          <CalculatedFactsAppendix snapshot={report.sourceSnapshot} />
        </section>

        <section id="methodology" aria-labelledby="methodology-heading" className="flex flex-col gap-2 border-t border-border-subtle pt-6">
          <SectionHeading id="methodology-heading">Methodology & AI Disclosure</SectionHeading>
          <p className="text-body-sm text-text-secondary">{result.methodology}</p>
        </section>

        <div className="flex flex-wrap items-center gap-3 border-t border-border-subtle pt-6">
          <Link href="/companion">
            <Button variant="secondary" size="sm">
              Ask Companion about this report
            </Button>
          </Link>
          {premiumStatus?.isPremium && (
            <Button variant="ghost" size="sm" onClick={() => regenerate.mutate()} loading={regenerate.isPending}>
              Generate a new version
            </Button>
          )}
        </div>
      </article>
    </div>
  );
}

/** Only links to sections that actually exist on the page — a report without Tarot/Memory context
 * correctly omits "Current Themes"/"Personalized Reflection" links entirely (never a dead link
 * pointing at a section that was never rendered, matching this product's "no dead CTA" discipline). */
function ReportTableOfContents({ hasCurrentThemes, hasPersonalizedReflection }: { hasCurrentThemes: boolean; hasPersonalizedReflection: boolean }) {
  const sections = SECTIONS.filter((section) => {
    if (section.id === 'current-themes') return hasCurrentThemes;
    if (section.id === 'personalized-reflection') return hasPersonalizedReflection;
    return true;
  });

  return (
    <nav aria-label="Report sections" className="hidden w-48 shrink-0 desktop:block">
      <ul className="sticky top-6 flex flex-col gap-1 text-caption">
        {sections.map((section) => (
          <li key={section.id}>
            <a href={`#${section.id}`} className="block rounded-sm px-2 py-1 text-text-secondary hover:bg-surface hover:text-text-primary">
              {section.heading}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="font-display text-body-lg text-text-primary">
      {children}
    </h2>
  );
}

function NarrativeSection({ id, heading, section, badge }: { id: string; heading: string; section: ReportNarrativeSectionDto; badge?: string }) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <SectionHeading id={`${id}-heading`}>{heading}</SectionHeading>
        {badge && <Badge variant="insight">{badge}</Badge>}
      </div>
      <p className="text-body-md text-text-primary">{section.narrative}</p>
    </section>
  );
}

function TitledSectionGroup({ id, heading, items }: { id: string; heading: string; items: ReportTitledSectionDto[] }) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="flex flex-col gap-3">
      <SectionHeading id={`${id}-heading`}>{heading}</SectionHeading>
      <ul className="flex flex-col gap-3">
        {items.map((item, i) => (
          <li key={i}>
            <p className="text-body-sm font-semibold text-text-primary">{item.title}</p>
            <p className="text-body-sm text-text-secondary">{item.narrative}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function CalculatedFactsAppendix({ snapshot }: { snapshot: ReportDto['sourceSnapshot'] }) {
  return (
    <div className="flex flex-col gap-4 rounded-md border border-border-subtle p-4">
      <div>
        <p className="mb-1.5 text-body-sm font-semibold text-text-secondary">Natal Chart</p>
        <ul className="flex flex-col gap-1">
          {snapshot.natalChart.placements.map((placement, i) => (
            <li key={i} className="text-caption text-text-secondary">
              {placement.body} in {placement.sign}
              {placement.house ? `, house ${placement.house}` : ''}
              {placement.retrograde ? ' (retrograde)' : ''}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="mb-1.5 text-body-sm font-semibold text-text-secondary">Numerology</p>
        <ul className="flex flex-col gap-1">
          {snapshot.numerology.values.map((value, i) => (
            <li key={i} className="text-caption text-text-secondary">
              {value.type.replace('_', ' ')}: {value.value}
              {value.isMasterNumber ? ' (Master Number)' : ''}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
