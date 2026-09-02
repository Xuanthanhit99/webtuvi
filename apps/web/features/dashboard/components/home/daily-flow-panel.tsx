import Link from 'next/link';
import { Briefcase, ChevronRight, Coins, Heart, Lock } from 'lucide-react';
import type { TuViChartDto } from '@beaconvie/types';
import { Skeleton } from '@/components/ui/skeleton';

function formatDaiVan(cycle: TuViChartDto['currentDaiVan']): string | null {
  if (!cycle) return null;
  return `${cycle.ageStart}–${cycle.ageEnd} tuổi · Cung ${cycle.role} tại ${cycle.position}`;
}

/**
 * Static fallback — there is no personalized "daily flow" scoring engine yet (Eastern Horoscope,
 * which would compute this from the user's real chart, is spec'd but not built — see CLAUDE.md).
 * These illustrate the locked hero composition until that data exists; do not wire a fabricated
 * API for this, and do not present it as chart-derived.
 */
const FLOW_METRICS = [
  { key: 'career', label: 'Công việc', value: 78, insight: 'Thuận lợi để bắt đầu dự án mới.', icon: Briefcase, color: '#5b8def' },
  { key: 'love', label: 'Tình cảm', value: 65, insight: 'Dành thời gian cho người thân yêu.', icon: Heart, color: '#e0668b' },
  { key: 'finance', label: 'Tài chính', value: 82, insight: 'Có cơ hội nhận thêm nguồn thu.', icon: Coins, color: '#d5ad62' },
] as const;

// Reads as part of the hero scene, not a card pasted on top of it: a very faint edge, mostly-
// transparent tint, and a heavier blur so the mountains/lake behind it stay visible through the
// glass rather than being hidden behind an opaque panel.
const PANEL_SHELL =
  'rounded-[18px] border border-[#d5ad62]/[0.09] bg-[#0e1726]/22 p-4 shadow-[0_10px_34px_rgba(0,0,0,0.18)] backdrop-blur-xl tablet:rounded-[20px] tablet:p-5';

/**
 * Guest teaser — an anonymous visitor has no chart/account to summarize, so this stays an
 * honest locked preview rather than showing illustrative numbers as if they were personal.
 */
export function DailyFlowPanelLocked() {
  return (
    <div className={PANEL_SHELL}>
      <p className="text-caption font-semibold uppercase tracking-[0.16em] text-[#e6c980]">Dòng chảy hôm nay</p>
      <div className="mt-3 flex items-center gap-3 rounded-[13px] bg-[#070b12]/28 p-3.5 ring-1 ring-inset ring-white/[0.06] tablet:mt-4 tablet:p-4">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-[#0b1220]/40 text-[#e6c980] tablet:h-9 tablet:w-9">
          <Lock className="h-4 w-4" aria-hidden="true" />
        </span>
        <p className="text-body-sm leading-relaxed text-[#d8d1c2]">Đăng nhập để mở vận trình hôm nay.</p>
      </div>
      <Link href="/login?next=%2F" className="mt-3 inline-flex min-h-9 items-center gap-2 text-body-sm font-semibold text-[#e6c980] tablet:mt-4">
        Đăng nhập <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </div>
  );
}

/**
 * Hero right-column panel — a translucent glass card living directly inside the Hero (not a
 * separate dashboard section) per the locked visual master: "Dòng chảy hôm nay", 3 illustrative
 * flow signals, with the real Tu Vi cycle / daily-insight status underneath.
 */
export function DailyFlowPanel({
  loading,
  error,
  text,
  onRetry,
  tuViChart,
  tuViLoading,
}: {
  loading: boolean;
  error: boolean;
  text?: string;
  onRetry: () => void;
  tuViChart: TuViChartDto | null;
  tuViLoading: boolean;
}) {
  if (loading || tuViLoading) {
    return (
      <div className={PANEL_SHELL}>
        <Skeleton className="mb-4 h-5 w-36 bg-white/10" />
        <Skeleton className="h-28 w-full bg-white/10" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={PANEL_SHELL}>
        <p className="text-body-sm font-semibold text-[#e6c980]">Dòng chảy hôm nay</p>
        <p className="mt-3 text-body-sm text-[#a6a7ac]">Không thể tải vận trình hôm nay.</p>
        <button type="button" onClick={onRetry} className="mt-4 min-h-11 rounded-md border border-[#d5ad62]/35 px-4 text-body-sm font-semibold text-[#e6c980]">
          Thử lại
        </button>
      </div>
    );
  }

  const daiVanText = formatDaiVan(tuViChart?.currentDaiVan ?? null);

  return (
    <div className={PANEL_SHELL}>
      <p className="text-caption font-semibold uppercase tracking-[0.18em] text-[#e6c980]">Dòng chảy hôm nay</p>
      <div className="mt-4 space-y-4">
        {FLOW_METRICS.map((metric) => (
          <div key={metric.key} className="flex items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-[#0b1220]/40 text-[#e6c980]">
              <metric.icon className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-body-sm font-medium text-[#f2eee5]">{metric.label}</p>
                <p className="text-body-sm font-semibold text-[#e6c980]">{metric.value}%</p>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full" style={{ width: `${metric.value}%`, background: metric.color }} />
              </div>
              <p className="mt-1 text-caption leading-relaxed text-[#a6a7ac]">{metric.insight}</p>
            </div>
          </div>
        ))}
      </div>

      {!tuViChart && (
        <div className="mt-4 border-t border-white/10 pt-3">
          <p className="text-body-sm text-[#a6a7ac]">Bạn chưa lập lá số Tử Vi.</p>
          <Link href="/discover/tu-vi" className="mt-2 inline-flex min-h-9 items-center gap-2 text-body-sm font-semibold text-[#e6c980]">
            Lập lá số đầu tiên <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      )}
      {tuViChart && daiVanText && (
        <p className="mt-4 border-t border-white/10 pt-3 text-caption text-[#a6a7ac]">
          Đại Vận hiện tại: <span className="text-[#d8d1c2]">{daiVanText}</span>
        </p>
      )}

      <p className="mt-3 text-caption leading-relaxed text-[#a6a7ac]">{text ?? 'Vận trình hôm nay chưa được tạo.'}</p>

      <Link href="/discover" className="mt-3 inline-flex min-h-9 items-center gap-1.5 text-body-sm font-semibold text-[#e6c980]">
        Xem chi tiết <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </div>
  );
}
