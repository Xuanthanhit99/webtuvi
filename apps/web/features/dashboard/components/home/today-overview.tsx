import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { DestinyOrbit } from './destiny-orbit';
import { MvV2Eyebrow, MvV2Signal, MvV2Surface } from '@/components/ui/mv-v2';
import { Skeleton } from '@/components/ui/skeleton';

export type TodayOverviewSignal = {
  label: string;
  value: string;
  href: string;
};

export function TodayOverview({
  loading,
  tuVi,
  tarot,
  natal,
  numerology,
}: {
  loading: boolean;
  tuVi: TodayOverviewSignal | null;
  tarot: TodayOverviewSignal | null;
  natal: TodayOverviewSignal | null;
  numerology: TodayOverviewSignal | null;
}) {
  const signals = [tuVi, tarot, natal, numerology].filter((item): item is TodayOverviewSignal => item !== null);

  return (
    <MvV2Surface ariaLabelledby="today-overview-heading" className="bg-[radial-gradient(circle_at_18%_45%,rgba(213,173,98,0.09),transparent_28%),linear-gradient(135deg,rgba(10,18,31,0.98),rgba(8,13,24,0.94))]">
      <div className="grid items-center gap-6 p-5 tablet:grid-cols-[220px_minmax(0,1fr)] tablet:p-7 desktop:grid-cols-[260px_minmax(0,1fr)] desktop:p-8">
        <div className="relative mx-auto w-full max-w-[220px] tablet:max-w-[250px]">
          <DestinyOrbit className="w-full opacity-90" />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="rounded-full border border-[#d5ad62]/20 bg-[#080d17]/75 px-4 py-2 text-center backdrop-blur-sm">
              <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9b9da3]">Mệnh Vi</span>
              <span className="mt-0.5 block font-display text-body-md font-semibold text-[#f6e3ad]">Hôm nay</span>
            </div>
          </div>
        </div>

        <div className="min-w-0">
          <MvV2Eyebrow>Không gian cá nhân</MvV2Eyebrow>
          <h2 id="today-overview-heading" className="mt-2 font-display text-heading-lg font-semibold text-[#f2eee5]">
            Hôm nay của bạn
          </h2>
          <p className="mt-2 max-w-2xl text-body-sm leading-relaxed text-[#aeb0b5]">
            Một điểm nhìn chung từ lá số, trải bài và các hồ sơ bạn đã thực sự tạo trong Mệnh Vi.
          </p>

          {loading ? (
            <div className="mt-6 grid gap-5 tablet:grid-cols-2">
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="space-y-2">
                  <Skeleton className="h-3 w-24 bg-white/10" />
                  <Skeleton className="h-5 w-full bg-white/10" />
                </div>
              ))}
            </div>
          ) : signals.length > 0 ? (
            <div className="mt-6 grid gap-x-8 gap-y-6 tablet:grid-cols-2">
              {signals.map((signal) => (
                <MvV2Signal key={signal.label} {...signal} />
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
              <p className="text-body-sm text-[#b8b4ab]">Bạn chưa có đủ dữ liệu cá nhân để tạo tổng quan hôm nay.</p>
              <Link href="/discover" className="mt-3 inline-flex min-h-10 items-center gap-2 text-body-sm font-semibold text-[#e6c980]">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                Bắt đầu khám phá
              </Link>
            </div>
          )}
        </div>
      </div>
    </MvV2Surface>
  );
}
