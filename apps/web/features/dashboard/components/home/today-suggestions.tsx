import Image from 'next/image';
import { Compass, Hourglass, MoonStar, Sparkles } from 'lucide-react';
import { HOME_BACKGROUND, HOME_DECOR } from './production-assets';

const SUGGESTIONS = [
  {
    icon: Hourglass,
    label: 'Dành một khoảng lặng',
    lines: ['Chọn một thời điểm thuận tiện.', 'Dành vài phút cho câu hỏi của bạn.'],
  },
  {
    icon: Compass,
    label: 'Chọn điều muốn hiểu',
    lines: ['Một câu hỏi cụ thể giúp bạn bắt đầu.', 'Khám phá theo nhịp riêng của mình.'],
  },
  {
    icon: MoonStar,
    label: 'Ghi lại suy ngẫm',
    lines: ['Ghi lại điều khiến bạn chú ý.', 'Quay lại xem góc nhìn thay đổi ra sao.'],
  },
] as const;

export function TodaySuggestions({ energyText }: { energyText?: string }) {
  return (
    <section aria-labelledby="today-suggestions-heading" className="relative min-h-[260px] overflow-hidden rounded-[20px] border border-white/[0.06]">
      <h2 id="today-suggestions-heading" className="sr-only">
        Gợi ý cho bạn hôm nay
      </h2>
      <Image
        src={HOME_BACKGROUND.journeyBanner}
        alt=""
        fill
        aria-hidden="true"
        // Verified via direct fetch: this source (565x148 native) is capped the same way as the
        // Hero background — any requested width ≥565px returns the identical native file for the
        // same bytes, while anything below genuinely downscales further. A flat value safely
        // above native (see hero.tsx for the full reasoning) avoids accidentally landing below it.
        sizes="(max-width: 767px) 100vw, 1248px"
        className="pointer-events-none object-cover"
      />
      {/* Localized scrim — concentrated behind the text zone (top ~65%) and cleared out toward
          the bottom, where the landscape/lanterns live, instead of one flat wash over the whole
          panel darkening scenery that has no text over it. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'linear-gradient(to bottom, rgba(5,8,16,0.58) 0%, rgba(6,10,20,0.4) 45%, rgba(5,8,16,0.1) 72%, transparent 100%)' }}
        aria-hidden="true"
      />
      {/* Approved crane/lotus/lantern decor accents, faded at the edges via mask so any
          sprite-sheet bleed from neighboring cells in the source file never shows a hard edge —
          same technique as the Discovery card artwork masks. Cinematic dressing behind the
          content, not a competing layer — everything below stays legible. */}
      <Image
        src={HOME_DECOR.cranes}
        alt=""
        aria-hidden="true"
        width={295}
        height={190}
        sizes="180px"
        className="pointer-events-none absolute -top-2 right-[6%] hidden w-32 opacity-45 tablet:block"
        style={{ WebkitMaskImage: 'radial-gradient(ellipse 60% 65% at 50% 45%, black 40%, transparent 85%)', maskImage: 'radial-gradient(ellipse 60% 65% at 50% 45%, black 40%, transparent 85%)' }}
      />
      <Image
        src={HOME_DECOR.lotus}
        alt=""
        aria-hidden="true"
        width={120}
        height={125}
        sizes="90px"
        className="pointer-events-none absolute bottom-0 left-[3%] hidden w-16 opacity-50 tablet:block"
        style={{ WebkitMaskImage: 'radial-gradient(ellipse 60% 60% at 45% 55%, black 35%, transparent 85%)', maskImage: 'radial-gradient(ellipse 60% 60% at 45% 55%, black 35%, transparent 85%)' }}
      />
      <Image
        src={HOME_DECOR.lanterns}
        alt=""
        aria-hidden="true"
        width={358}
        height={240}
        sizes="140px"
        className="pointer-events-none absolute bottom-0 right-[2%] hidden w-24 opacity-40 desktop:block"
        style={{ WebkitMaskImage: 'radial-gradient(ellipse 55% 60% at 50% 60%, black 35%, transparent 85%)', maskImage: 'radial-gradient(ellipse 55% 60% at 50% 60%, black 35%, transparent 85%)' }}
      />

      <div className="relative grid grid-cols-2 gap-x-4 gap-y-6 p-4 min-[430px]:p-5 tablet:grid-cols-4 tablet:gap-7 tablet:p-9">
        {SUGGESTIONS.map((item) => (
          <div key={item.label}>
            <div className="flex items-center gap-2 text-[#e6c980]">
              <item.icon className="h-4 w-4" aria-hidden="true" />
              <p className="text-caption font-semibold uppercase tracking-[0.14em]">{item.label}</p>
            </div>
            <div className="mt-2 space-y-1 tablet:mt-2.5">
              {item.lines.map((line) => (
                <p key={line} className="text-caption leading-relaxed text-[#d8d1c2] tablet:text-body-sm">
                  {line}
                </p>
              ))}
            </div>
          </div>
        ))}
        <div>
          <div className="flex items-center gap-2 text-[#e6c980]">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            <p className="text-caption font-semibold uppercase tracking-[0.14em]">Năng lượng</p>
          </div>
          <p className="mt-2 text-caption leading-relaxed text-[#d8d1c2] tablet:mt-2.5 tablet:text-body-sm">
            {energyText ?? 'Đây là gợi ý suy ngẫm chung, không phải dự báo vận hạn hay năng lượng cá nhân.'}
          </p>
        </div>
      </div>
    </section>
  );
}
