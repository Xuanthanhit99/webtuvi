import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { NatalChartDto, TarotReadingDto, TuViChartDto } from '@beaconvie/types';
import { FEATURE_ART_ASSET, FEATURE_BADGE_ASSET, type DiscoveryModuleKey } from './production-assets';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/cn';
import { trackEvent } from '@/lib/analytics';
import type { ClientAnalyticsEventName } from '@beaconvie/types';

type FeatureAnalyticsEvent = Extract<
  ClientAnalyticsEventName,
  'home_tuvi_clicked' | 'home_tarot_clicked' | 'home_astrology_clicked' | 'home_numerology_clicked'
>;

const MODULE_META: Record<
  DiscoveryModuleKey,
  { title: string; analyticsEvent: FeatureAnalyticsEvent; identityTint: string }
> = {
  tu_vi: {
    title: 'Lá số Tử Vi',
    analyticsEvent: 'home_tuvi_clicked',
    // Warm bronze/parchment identity wash — the source art itself is a gold bagua wheel on deep
    // blue, not literal parchment paper, so this overlay is what actually carries the "parchment
    // / warm bronze" identity rather than the raw crop.
    identityTint: 'linear-gradient(160deg, rgba(214,163,96,0.4) 0%, rgba(120,74,32,0.22) 55%, rgba(20,14,8,0.1) 100%)',
  },
  tarot: {
    title: 'Tarot',
    analyticsEvent: 'home_tarot_clicked',
    identityTint: 'linear-gradient(160deg, rgba(126,90,214,0.32) 0%, rgba(76,60,150,0.18) 55%, transparent 100%)',
  },
  natal_chart: {
    title: 'Bản đồ sao',
    analyticsEvent: 'home_astrology_clicked',
    identityTint: 'linear-gradient(160deg, rgba(74,124,196,0.34) 0%, rgba(40,80,150,0.18) 55%, transparent 100%)',
  },
  numerology: {
    title: 'Thần số học',
    analyticsEvent: 'home_numerology_clicked',
    identityTint: 'linear-gradient(160deg, rgba(139,92,246,0.34) 0%, rgba(90,50,180,0.18) 55%, transparent 100%)',
  },
};

function FeatureCard({
  asset,
  description,
  cta,
  href,
  loading,
  error,
  onRetry,
}: {
  asset: DiscoveryModuleKey;
  description: string;
  cta: string;
  href: string;
  loading?: boolean;
  error?: string;
  onRetry: () => void;
}) {
  const meta = MODULE_META[asset];

  if (loading) {
    return (
      <div className="flex h-[268px] flex-col overflow-hidden rounded-[18px] border border-white/10 bg-[#0e1524]/70 p-4 desktop:h-[300px]" aria-label={`${meta.title} đang tải`}>
        <Skeleton className="h-[150px] w-full bg-white/10 desktop:h-[58%]" />
        <Skeleton className="mt-4 h-4 w-24 bg-white/10" />
        <Skeleton className="mt-2 h-8 w-full bg-white/10" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[268px] flex-col justify-center rounded-[18px] border border-white/10 bg-[#0e1524]/70 p-4 desktop:h-[300px] desktop:p-5">
        <h3 className="text-body-md font-semibold text-[#f2eee5]">{meta.title}</h3>
        <p className="mt-1.5 text-caption leading-snug text-[#a6a7ac]">{error}</p>
        <button type="button" onClick={onRetry} className="mt-3 inline-flex min-h-9 w-fit items-center text-caption font-semibold text-[#e6c980]">
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <Link
      href={href}
      onClick={() => {
        trackEvent('home_feature_clicked', { feature: 'home', source: meta.title });
        trackEvent(meta.analyticsEvent, { feature: asset, source: 'home' });
      }}
      className={cn(
        'group flex h-[268px] flex-col overflow-hidden rounded-[18px] border border-white/10 bg-[#0c1420] transition-[transform,border-color,box-shadow] duration-standard desktop:h-[300px]',
        'hover:-translate-y-[3px] hover:border-[#d5ad62]/45 hover:shadow-[0_16px_36px_-12px_rgba(213,173,98,0.28)] focus-visible:-translate-y-[3px] focus-visible:border-[#d5ad62]/45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d5ad62] motion-reduce:transform-none',
      )}
    >
      {/* Artwork fills the top ~62% of the card edge-to-edge (object-cover, intentional crop —
          not a narrow portrait floating in a wide box) then fades into the content below. */}
      <div className="relative h-[150px] shrink-0 overflow-hidden desktop:h-[62%]">
        {/* Goes through Next's optimizer (not `unoptimized`) so it's ready for the HD masters
            (see production-assets.ts's ASSET_RESOLUTION_TARGETS): confirmed live against this
            exact endpoint that Next never upscales past a source's native size — serving the
            current ~140x287 files this way is visually identical to `unoptimized` today (both
            just return the tiny source), but once ~1000x800 masters replace them at this same
            path, this is what makes Next actually generate a correctly-sized ~300px variant
            instead of shipping the full HD file to every card. No code change needed at swap
            time. */}
        <Image
          src={FEATURE_ART_ASSET[asset]}
          alt=""
          fill
          sizes="(min-width: 1280px) 300px, 45vw"
          className="object-cover transition-transform duration-standard group-hover:scale-[1.04]"
        />
        {/* Module-identity color wash — the raw crop alone doesn't carry each module's intended
            hue (e.g. the Tử Vi asset is gold-on-navy, not literal parchment), so this soft-light
            tint is what actually establishes the identity color on top of the real artwork. */}
        <div className="pointer-events-none absolute inset-0 mix-blend-soft-light" style={{ background: meta.identityTint }} aria-hidden="true" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0c1420] to-transparent" />
      </div>

      <div className="flex flex-1 flex-col p-3.5 desktop:p-4">
        <div className="flex items-center gap-2">
          <span className="relative h-4 w-4 shrink-0 desktop:h-5 desktop:w-5">
            <Image src={FEATURE_BADGE_ASSET[asset]} alt="" fill sizes="20px" className="object-contain" />
          </span>
          <h3 className="font-display text-body-sm font-semibold text-[#f2eee5] desktop:text-body-md">{meta.title}</h3>
        </div>
        <p className="mt-1 line-clamp-2 flex-1 text-caption leading-relaxed text-[#a6a7ac] desktop:mt-1.5">{description}</p>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-caption font-medium text-[#e6c980]">{cta}</span>
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#d5ad62]/30 text-[#e6c980] transition-[transform,border-color] duration-standard group-hover:border-[#d5ad62]/60 group-hover:translate-x-0.5 desktop:h-8 desktop:w-8">
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function guestHref(discoverPath: string): string {
  return `/register?next=${encodeURIComponent(discoverPath)}`;
}

export function FeatureGrid({
  isGuest,
  tuViChart,
  tuViLoading,
  tuViError,
  onRetryTuVi,
  tarotReading,
  tarotLoading,
  tarotError,
  onRetryTarot,
  natalChart,
  natalLoading,
  natalError,
  onRetryNatal,
  sunSign,
  moonSign,
  lifePath,
  numerologyLoading,
  numerologyError,
  onRetryNumerology,
}: {
  isGuest: boolean;
  tuViChart: TuViChartDto | null;
  tuViLoading: boolean;
  tuViError: boolean;
  onRetryTuVi: () => void;
  tarotReading: TarotReadingDto | null;
  tarotLoading: boolean;
  tarotError: boolean;
  onRetryTarot: () => void;
  natalChart: NatalChartDto | null;
  natalLoading: boolean;
  natalError: boolean;
  onRetryNatal: () => void;
  sunSign: string | null;
  moonSign: string | null;
  lifePath: number | null;
  numerologyLoading: boolean;
  numerologyError: boolean;
  onRetryNumerology: () => void;
}) {
  return (
    <section aria-labelledby="features-heading" className="space-y-4">
      <h2 id="features-heading" className="font-display text-heading-md font-semibold text-[#f2eee5]">
        Khám phá vận mệnh
      </h2>
      <div className="grid grid-cols-2 gap-4 desktop:grid-cols-4">
        <FeatureCard
          asset="tu_vi"
          description={tuViChart ? `Mệnh an tại ${tuViChart.palaces.menh}.` : 'Bản đồ vận mệnh theo Tử Vi Đẩu Số.'}
          cta={isGuest ? 'Bắt đầu' : tuViChart ? 'Xem lá số' : 'Lập lá số'}
          href={isGuest ? guestHref('/discover/tu-vi') : '/discover/tu-vi'}
          loading={!isGuest && tuViLoading}
          error={tuViError ? 'Không thể tải lá số.' : undefined}
          onRetry={onRetryTuVi}
        />
        <FeatureCard
          asset="tarot"
          description={tarotReading ? `Gần nhất: ${tarotReading.spreadName}${tarotReading.cards[0]?.card.name ? ` · ${tarotReading.cards[0].card.name}` : ''}.` : 'Một lá bài cho câu hỏi của bạn.'}
          cta={isGuest ? 'Bắt đầu' : tarotReading ? 'Xem trải bài' : 'Rút bài'}
          href={isGuest ? guestHref('/discover/tarot') : '/discover/tarot'}
          loading={!isGuest && tarotLoading}
          error={tarotError ? 'Không thể tải lịch sử Tarot.' : undefined}
          onRetry={onRetryTarot}
        />
        <FeatureCard
          asset="natal_chart"
          description={natalChart ? `Mặt Trời ${sunSign ?? 'đã tính'} · Mặt Trăng ${moonSign ?? 'đã tính'}.` : 'Cần ngày, giờ và nơi sinh để lập bản đồ.'}
          cta={isGuest ? 'Bắt đầu' : natalChart ? 'Xem bản đồ' : 'Tạo bản đồ'}
          href={isGuest ? guestHref('/discover/natal-chart') : '/discover/natal-chart'}
          loading={!isGuest && natalLoading}
          error={natalError ? 'Không thể tải bản đồ sao.' : undefined}
          onRetry={onRetryNatal}
        />
        <FeatureCard
          asset="numerology"
          description={lifePath ? `Con số chủ đạo: ${lifePath}.` : 'Các con số cốt lõi từ tên và ngày sinh.'}
          cta={isGuest ? 'Bắt đầu' : lifePath ? 'Xem luận giải' : 'Tính ngay'}
          href={isGuest ? guestHref('/discover/numerology') : '/discover/numerology'}
          loading={!isGuest && numerologyLoading}
          error={numerologyError ? 'Không thể tải thần số học.' : undefined}
          onRetry={onRetryNumerology}
        />
      </div>
    </section>
  );
}
