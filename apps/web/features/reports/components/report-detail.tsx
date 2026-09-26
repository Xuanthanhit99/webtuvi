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
import { PLANET_LABELS, SIGN_LABELS } from '@/features/natal-chart/labels';
import { VALUE_TYPE_LABELS } from '@/features/numerology/labels';

// Accessibility + Product Polish (2026-08-19): matches the existing polling convention already
// used for another async-generation status (premium-return-status.tsx's PENDING order polling).
const GENERATING_POLL_INTERVAL_MS = 2000;
// Generation is synchronous server-side, and the server's own concurrency lock self-heals after
// AI_CONCURRENCY_LOCK_TTL_MS (2 minutes by default) — so a report still GENERATING well past that
// is one whose request died with the process, and no amount of further polling will resolve it.
// Without this ceiling such a row polls every 2s for as long as the tab stays open.
const GENERATING_POLL_CUTOFF_MS = 5 * 60 * 1000;

const SECTIONS: { id: string; heading: string }[] = [
  { id: 'overview', heading: 'Tổng quan' },
  { id: 'core-identity', heading: 'Chân dung cốt lõi' },
  { id: 'strengths', heading: 'Điểm mạnh' },
  { id: 'growth-areas', heading: 'Khuynh hướng phát triển' },
  { id: 'relationships', heading: 'Quan hệ' },
  { id: 'career-direction', heading: 'Sự nghiệp & định hướng' },
  { id: 'current-themes', heading: 'Chủ đề hiện tại' },
  { id: 'personalized-reflection', heading: 'Suy ngẫm cá nhân' },
  { id: 'source-highlights', heading: 'Điểm tựa dữ liệu' },
  { id: 'calculated-facts', heading: 'Dữ kiện đã tính' },
  { id: 'methodology', heading: 'Phương pháp & minh bạch AI' },
];

function reportMutationErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === 'PREMIUM_REQUIRED') return 'Báo cáo Định mệnh Cá nhân là tính năng Premium.';
    if (error.code === 'REPORT_SOURCES_NOT_READY') return 'Bạn cần có cả Bản đồ sao và Thần số học trước khi tạo báo cáo.';
    if (error.code === 'REPORT_GENERATION_IN_PROGRESS') return 'Một báo cáo đang được tạo. Hãy chờ báo cáo đó hoàn tất trước.';
    if (error.code === 'RATE_LIMITED') return 'Bạn vừa thử hơi nhanh. Vui lòng chờ một lát rồi thử lại.';
  }
  return 'Chưa thể tạo lại báo cáo lúc này. Vui lòng thử lại.';
}

export function ReportDetail({ id, onClose, onRegenerated }: { id: string; onClose: () => void; onRegenerated: (id: string) => void }) {
  // Accessibility + Product Polish (2026-08-19): a report opened while still GENERATING (a
  // bookmark, a shared link, or a second tab — not the primary generate-button flow, which already
  // blocks synchronously until the real status is known) previously showed a static card forever,
  // with no way to discover completion short of a manual reload.
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['reports', id],
    queryFn: () => reportsApi.getReport(id),
    refetchInterval: (query) => {
      const report = query.state.data;
      if (report?.status !== 'GENERATING') return false;
      const age = Date.now() - new Date(report.createdAt).getTime();
      return age < GENERATING_POLL_CUTOFF_MS ? GENERATING_POLL_INTERVAL_MS : false;
    },
  });

  return (
    <div className="flex flex-col gap-4">
      <Button variant="ghost" size="sm" onClick={onClose}>
        ← Quay lại Báo cáo
      </Button>
      {isLoading && (
        <div role="status" aria-label="Đang tải báo cáo">
          <Skeleton className="h-64 w-full" />
        </div>
      )}
      {isError && (
        <ErrorState
          title="Chưa thể tải báo cáo"
          description="Báo cáo này chưa tải được. Hãy thử lại sau giây lát."
          onRetry={() => refetch()}
          retryLabel="Thử lại"
        />
      )}
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
      toast.error(reportMutationErrorMessage(error));
    },
  });

  // The FAILED state's retry lives inside `ErrorState`, whose button has no pending/disabled state
  // of its own — so a second click fired another POST that the server's generation lock rejected
  // with REPORT_GENERATION_IN_PROGRESS, surfacing an error toast caused by the user's own
  // double-click. Same guard `ReportsDashboard.handleGenerate` already applies to generation.
  function handleRegenerate() {
    if (regenerate.isPending) return;
    regenerate.mutate();
  }

  if (report.status === 'GENERATING') {
    return (
      <Card className="flex flex-col items-center gap-3 py-10 text-center" role="status">
        <Skeleton className="h-6 w-48" />
        <p className="break-words text-body-sm text-text-secondary">Đang kết nối những dữ kiện bạn đã cho phép dùng...</p>
      </Card>
    );
  }

  if (report.status === 'FAILED') {
    return (
      <ErrorState
        title="Báo cáo chưa tạo được"
        description={report.failureReason ? REPORT_FAILURE_REASON_MESSAGES[report.failureReason] : undefined}
        onRetry={handleRegenerate}
        retryLabel={regenerate.isPending ? 'Đang thử lại...' : 'Thử lại'}
      />
    );
  }

  const result = report.result;
  if (!result) return null;

  return (
    <div className="flex gap-6">
      <ReportTableOfContents hasCurrentThemes={!!result.currentThemes} hasPersonalizedReflection={!!result.personalizedReflection} />
      <article className="mx-auto flex min-w-0 max-w-[720px] flex-1 flex-col gap-8">
        <header className="flex flex-col gap-1">
          <h1 className="font-display text-heading-lg text-text-primary">Báo cáo Định mệnh Cá nhân</h1>
          <p className="text-caption text-text-secondary">Tạo ngày {new Date(report.createdAt).toLocaleDateString('vi-VN')}</p>
        </header>

        <section id="overview" aria-labelledby="overview-heading" className="flex flex-col gap-2">
          <SectionHeading id="overview-heading">Tổng quan</SectionHeading>
          <p className="break-words text-body-md text-text-primary">{result.overview}</p>
        </section>

        <SourceSummary snapshot={report.sourceSnapshot} />

        <NarrativeSection id="core-identity" heading="Chân dung cốt lõi" section={result.coreIdentity} />

        <TitledSectionGroup id="strengths" heading="Điểm mạnh" items={result.strengths} />

        <TitledSectionGroup id="growth-areas" heading="Khuynh hướng phát triển" items={result.growthAreas} />

        <NarrativeSection id="relationships" heading="Quan hệ" section={result.relationships} />

        <NarrativeSection id="career-direction" heading="Sự nghiệp & định hướng" section={result.careerDirection} />

        {result.currentThemes && <NarrativeSection id="current-themes" heading="Chủ đề hiện tại" section={result.currentThemes} badge="Từ Tarot gần đây" />}

        {result.personalizedReflection && (
          <NarrativeSection id="personalized-reflection" heading="Suy ngẫm cá nhân" section={result.personalizedReflection} badge="Từ Ký ức đã cho phép" />
        )}

        <section id="source-highlights" aria-labelledby="source-highlights-heading" className="flex flex-col gap-2">
          <SectionHeading id="source-highlights-heading">Điểm tựa dữ liệu</SectionHeading>
          <ul className="flex flex-col gap-1.5">
            {result.sourceHighlights.map((highlight, i) => (
              <li key={i} className="break-words text-body-sm text-text-secondary">
                <span className="font-semibold text-text-primary">{highlight.source}:</span> {highlight.fact}
              </li>
            ))}
          </ul>
        </section>

        <section id="calculated-facts" aria-labelledby="calculated-facts-heading" className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <SectionHeading id="calculated-facts-heading">Dữ kiện đã tính</SectionHeading>
            <Badge variant="neutral">Dữ kiện cố định, không do AI tạo</Badge>
          </div>
          <CalculatedFactsAppendix snapshot={report.sourceSnapshot} />
        </section>

        <section id="methodology" aria-labelledby="methodology-heading" className="flex flex-col gap-2 border-t border-border-subtle pt-6">
          <SectionHeading id="methodology-heading">Phương pháp & minh bạch AI</SectionHeading>
          <p className="break-words text-body-sm text-text-secondary">{result.methodology}</p>
        </section>

        <div className="flex flex-wrap items-center gap-3 border-t border-border-subtle pt-6">
          <Link href="/companion">
            <Button variant="secondary" size="sm">
              Hỏi Companion về báo cáo này
            </Button>
          </Link>
          {premiumStatus?.isPremium && (
            <Button variant="ghost" size="sm" onClick={handleRegenerate} loading={regenerate.isPending}>
              Tạo phiên bản mới
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
    <nav aria-label="Mục trong báo cáo" className="hidden w-48 shrink-0 desktop:block">
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
      <p className="break-words text-body-md text-text-primary">{section.narrative}</p>
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
            <p className="break-words text-body-sm text-text-secondary">{item.narrative}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function SourceSummary({ snapshot }: { snapshot: ReportDto['sourceSnapshot'] }) {
  const tarotCount = snapshot.tarot?.length ?? 0;
  const memoryCount = snapshot.memory?.length ?? 0;

  return (
    <section aria-labelledby="source-summary-heading" className="flex flex-col gap-3 rounded-md border border-border-subtle bg-surface p-4">
      <div className="flex flex-wrap items-center gap-2">
        <SectionHeading id="source-summary-heading">Nguồn đã dùng</SectionHeading>
        <Badge variant="neutral">Minh bạch dữ liệu</Badge>
      </div>
      <div className="grid gap-3 tablet:grid-cols-2">
        <SourceSummaryItem label="Bản đồ sao" value={`${snapshot.natalChart.placements.length} vị trí hành tinh/điểm chính`} />
        <SourceSummaryItem label="Thần số học" value={`${snapshot.numerology.values.length} chỉ số đã tính`} />
        <SourceSummaryItem label="Tarot" value={tarotCount > 0 ? `${tarotCount} trải bài gần đây` : 'Không dùng Tarot trong báo cáo này'} />
        <SourceSummaryItem label="Ký ức" value={memoryCount > 0 ? `${memoryCount} ký ức đã được phép dùng` : 'Không dùng Ký ức cá nhân'} />
      </div>
      <p className="text-caption text-text-secondary">
        AI chỉ tổng hợp và diễn giải từ các nguồn trên; các dữ kiện Bản đồ sao và Thần số học đã được tính trước, không được AI tự bịa thêm.
      </p>
    </section>
  );
}

function SourceSummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-caption font-semibold text-text-secondary">{label}</span>
      <span className="text-body-sm text-text-primary">{value}</span>
    </div>
  );
}

function CalculatedFactsAppendix({ snapshot }: { snapshot: ReportDto['sourceSnapshot'] }) {
  return (
    <div className="flex flex-col gap-4 rounded-md border border-border-subtle p-4">
      <div>
        <p className="mb-1.5 text-body-sm font-semibold text-text-secondary">Bản đồ sao</p>
        <ul className="flex flex-col gap-1">
          {snapshot.natalChart.placements.map((placement, i) => (
            <li key={i} className="text-caption text-text-secondary">
              {PLANET_LABELS[placement.body] ?? placement.body} ở {SIGN_LABELS[placement.sign] ?? placement.sign}
              {placement.house ? `, nhà ${placement.house}` : ''}
              {placement.retrograde ? ' (nghịch hành)' : ''}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="mb-1.5 text-body-sm font-semibold text-text-secondary">Thần số học</p>
        <ul className="flex flex-col gap-1">
          {snapshot.numerology.values.map((value, i) => (
            <li key={i} className="text-caption text-text-secondary">
              {VALUE_TYPE_LABELS[value.type] ?? value.type}: {value.value}
              {value.isMasterNumber ? ' (Số đặc biệt)' : ''}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
