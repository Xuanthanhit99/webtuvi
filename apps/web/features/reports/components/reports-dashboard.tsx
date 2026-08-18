'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { usePremiumStatus } from '@/features/premium/hooks/use-premium-status';
import { trackEvent } from '@/lib/analytics';
import { ApiError } from '@/lib/api-error';
import { reportsApi } from '../api/reports-api';
import { ReportReadinessPanel } from './report-readiness-panel';
import { ReportHistoryList } from './report-history-list';
import { ReportDetail } from './report-detail';

function generateErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === 'PREMIUM_REQUIRED') return 'Personal Destiny Report is a Premium feature.';
    if (error.code === 'REPORT_SOURCES_NOT_READY') return 'You’ll need both a Natal Chart and a Numerology reading first.';
    if (error.code === 'AI_BUDGET_EXCEEDED') return error.message;
    if (error.code === 'REPORT_GENERATION_IN_PROGRESS') return 'A report is already being generated. Please wait for it to finish.';
    if (error.code === 'RATE_LIMITED') return "You've tried a few times quickly — please wait a moment and try again.";
    return error.message;
  }
  return "Couldn't generate your report. Please try again.";
}

/**
 * `/reports` — Personal Destiny Report entry point (locked scope,
 * docs/product/personal-destiny-report-decisions.md). Uses the same `?item=<id>` "open detail in
 * place" pattern every other module in this product already uses (Memory/Insight/Review/Goal/
 * Tarot/Numerology).
 */
export function ReportsDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const activeId = searchParams.get('item');

  const { data: readiness } = useQuery({ queryKey: ['reports', 'readiness'], queryFn: reportsApi.readiness });
  const { data: premiumStatus } = usePremiumStatus();

  const generate = useMutation({
    mutationFn: () => reportsApi.generate(),
    onSuccess: (report) => {
      void queryClient.invalidateQueries({ queryKey: ['reports', 'list'] });
      selectItem(report.id);
      if (report.status === 'READY') toast.success('Your Personal Destiny Report is ready.');
      else toast.error('Your report couldn’t be generated this time — see details below.');
    },
    onError: (error) => toast.error(generateErrorMessage(error)),
  });

  function selectItem(id: string | null) {
    router.replace(id ? `/reports?item=${id}` : '/reports', { scroll: false });
  }

  function handleGenerate() {
    trackEvent('report_generation_started', { feature: 'reports' });
    generate.mutate();
  }

  if (activeId) {
    return <ReportDetail id={activeId} onClose={() => selectItem(null)} onRegenerated={(id) => selectItem(id)} />;
  }

  const isPremium = premiumStatus?.isPremium ?? false;
  const isReady = readiness?.ready ?? false;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-heading-lg text-text-primary">Personal Destiny Report</h1>
        <p className="mt-2 text-body-sm text-text-secondary">
          A long-form report bringing your Natal Chart and Numerology together into one narrative — grounded only in your real,
          already-calculated facts, never invented. Recent Tarot context and your Memory (with consent) can add texture, but the
          core report always starts from your two birth-derived systems.
        </p>
      </div>

      <ReportReadinessPanel />

      <Card className="flex flex-col gap-4">
        {!isPremium && (
          <p className="text-body-sm text-text-secondary">
            Personal Destiny Report is a Premium feature. Your Natal Chart and Numerology results themselves stay free either way.
          </p>
        )}
        <div className="flex items-center gap-3">
          <Button
            onClick={() => {
              if (!isPremium) {
                trackEvent('report_upgrade_clicked', { feature: 'reports' });
                router.push('/premium?reason=required');
                return;
              }
              handleGenerate();
            }}
            loading={generate.isPending}
            disabled={!isReady}
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            {isPremium ? 'Generate my report' : 'Upgrade to generate'}
          </Button>
          {!isReady && <span className="text-caption text-text-secondary">Complete both required sources above first.</span>}
        </div>
      </Card>

      <section aria-labelledby="reports-history-heading">
        <h2 id="reports-history-heading" className="mb-3 text-body-sm font-semibold text-text-secondary">
          History
        </h2>
        <ReportHistoryList filters={{}} onSelect={selectItem} />
      </section>
    </div>
  );
}
