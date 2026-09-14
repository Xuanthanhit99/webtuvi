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
import { MvPage, MvPageHeader, MvSection } from '@/components/ui/mv-page';

function generateErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === 'PREMIUM_REQUIRED') return 'Báo cáo Định mệnh Cá nhân là tính năng Premium.';
    if (error.code === 'REPORT_SOURCES_NOT_READY') return 'Bạn cần có cả Bản đồ sao và Thần số học trước khi tạo báo cáo.';
    if (error.code === 'AI_BUDGET_EXCEEDED') return 'Hệ thống AI đang tạm giới hạn. Vui lòng thử lại sau.';
    if (error.code === 'REPORT_GENERATION_IN_PROGRESS') return 'Một báo cáo đang được tạo. Hãy chờ báo cáo đó hoàn tất trước.';
    if (error.code === 'RATE_LIMITED') return 'Bạn vừa thử hơi nhanh. Vui lòng chờ một lát rồi thử lại.';
  }
  return 'Chưa thể tạo báo cáo lúc này. Vui lòng thử lại.';
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

  const readinessQuery = useQuery({ queryKey: ['reports', 'readiness'], queryFn: reportsApi.readiness });
  const premiumQuery = usePremiumStatus();

  const generate = useMutation({
    mutationFn: () => reportsApi.generate(),
    onSuccess: (report) => {
      void queryClient.invalidateQueries({ queryKey: ['reports', 'list'] });
      selectItem(report.id);
      if (report.status === 'READY') toast.success('Báo cáo Định mệnh Cá nhân đã sẵn sàng.');
      else toast.error('Báo cáo chưa tạo được lần này. Bạn có thể xem chi tiết bên dưới.');
    },
    onError: (error) => toast.error(generateErrorMessage(error)),
  });

  function selectItem(id: string | null) {
    router.replace(id ? `/reports?item=${id}` : '/reports', { scroll: false });
  }

  function handleGenerate() {
    if (generate.isPending) return;
    trackEvent('report_generation_started', { feature: 'reports' });
    generate.mutate();
  }

  if (activeId) {
    return <ReportDetail id={activeId} onClose={() => selectItem(null)} onRegenerated={(id) => selectItem(id)} />;
  }

  const readiness = readinessQuery.data;
  const premiumStatus = premiumQuery.data;
  const isPremium = premiumStatus?.isPremium === true;
  const isReady = readiness?.ready === true;
  const premiumUnavailable = premiumQuery.isError || (!premiumQuery.isLoading && !premiumStatus);
  const readinessUnavailable = readinessQuery.isError || (!readinessQuery.isLoading && !readiness);
  const generateDisabled = !isReady || readinessUnavailable || premiumQuery.isLoading || premiumUnavailable || generate.isPending;

  return (
    <MvPage>
      <MvPageHeader
        eyebrow="Báo cáo Premium"
        title="Báo cáo Định mệnh Cá nhân"
        description="Một báo cáo dài kết nối Bản đồ sao và Thần số học của bạn thành một mạch kể thống nhất, chỉ dựa trên dữ kiện đã được tính sẵn. Tarot gần đây và Ký ức đã cho phép có thể bổ sung sắc thái, nhưng phần lõi luôn bắt đầu từ hai hệ thống sinh trắc của bạn."
      />

      <ReportReadinessPanel />

      <Card className="flex flex-col gap-4">
        {premiumUnavailable && (
          <p className="text-body-sm text-text-secondary">Chưa thể kiểm tra trạng thái Premium. Hãy thử lại sau khi kết nối ổn định.</p>
        )}
        {!premiumUnavailable && !premiumQuery.isLoading && !isPremium && (
          <p className="text-body-sm text-text-secondary">
            Báo cáo Định mệnh Cá nhân là tính năng Premium. Bản đồ sao và Thần số học riêng lẻ của bạn vẫn miễn phí.
          </p>
        )}
        {/* Wraps like every other action row in this feature: at 375px the Vietnamese button label
            plus the readiness caption exceed the card's content width, and without wrapping the
            button shrinks until its text overflows its own fixed h-11 box. */}
        <div className="flex flex-wrap items-center gap-3">
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
            disabled={generateDisabled}
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            {premiumQuery.isLoading ? 'Đang kiểm tra Premium' : isPremium ? 'Tạo báo cáo của tôi' : 'Nâng cấp để tạo báo cáo'}
          </Button>
          {readinessUnavailable && <span className="text-caption text-text-secondary">Chưa thể kiểm tra điều kiện tạo báo cáo.</span>}
          {!readinessUnavailable && !isReady && <span className="text-caption text-text-secondary">Hoàn thành hai nguồn bắt buộc ở trên trước.</span>}
        </div>
      </Card>

      <MvSection eyebrow="Báo cáo" title="Lịch sử">
        <ReportHistoryList filters={{}} onSelect={selectItem} />
      </MvSection>
    </MvPage>
  );
}
