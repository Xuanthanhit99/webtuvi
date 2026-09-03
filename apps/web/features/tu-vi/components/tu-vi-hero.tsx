import { ArrowDown, BookOpen, CalendarClock, ShieldCheck } from 'lucide-react';
import { TuViAstrolabe } from './tu-vi-astrolabe';

const METHOD_POINTS = [
  { icon: CalendarClock, label: 'Ngày · giờ sinh', description: 'Dữ liệu đầu vào quyết định lá số' },
  { icon: ShieldCheck, label: 'Hệ quy tắc cố định', description: 'Cung và sao không do AI lựa chọn' },
  { icon: BookOpen, label: '12 cung để khám phá', description: 'Đọc tổng thể rồi đi sâu từng cung' },
] as const;

export function TuViHero() {
  return (
    <section aria-labelledby="tu-vi-hero-heading" className="relative isolate overflow-hidden rounded-[22px] border border-[#d5ad62]/20 bg-[#080d16] px-5 py-7 shadow-[0_28px_90px_rgba(0,0,0,0.34)] tablet:px-9 tablet:py-10 desktop:min-h-[470px] desktop:px-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_38%,rgba(213,173,98,0.12),transparent_31%),linear-gradient(112deg,rgba(7,11,18,0.98)_18%,rgba(9,16,27,0.9)_58%,rgba(12,23,36,0.78))]" />
      <div className="pointer-events-none absolute -bottom-24 -left-10 h-56 w-[72%] rounded-[50%] border border-[#708c79]/15" />
      <div className="pointer-events-none absolute bottom-5 left-[8%] h-px w-[56%] bg-gradient-to-r from-transparent via-[#d5ad62]/25 to-transparent" />

      <div className="relative z-10 grid items-center gap-7 desktop:grid-cols-[minmax(0,1fr)_390px] desktop:gap-12">
        <div className="max-w-2xl">
          <p className="text-caption font-semibold uppercase tracking-[0.24em] text-[#e6c980]">Tử Vi Đẩu Số · VĐTTL 1956</p>
          <h1 id="tu-vi-hero-heading" className="mt-3 font-display text-[clamp(2.35rem,5vw,4.25rem)] font-semibold leading-[1.02] text-[#f2eee5]">Lá số Tử Vi</h1>
          <p className="mt-4 max-w-xl text-body-md leading-relaxed text-[#d8d1c2] tablet:text-body-lg">
            Tạo bản đồ vận mệnh từ ngày sinh, giờ sinh và giới tính của bạn. Khám phá 12 cung, hệ thống sao và những chu kỳ đã được tính bằng quy tắc xác định.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="#tu-vi-form" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#d5ad62] px-5 text-body-sm font-semibold text-[#070b12] transition-colors hover:bg-[#e6c980] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d5ad62]">
              Lập lá số <ArrowDown className="h-4 w-4" aria-hidden="true" />
            </a>
            <a href="#tu-vi-history" className="inline-flex min-h-11 items-center justify-center rounded-md border border-[#d5ad62]/30 bg-[#0b1220]/60 px-5 text-body-sm font-semibold text-[#e6c980] transition-colors hover:border-[#d5ad62]/55 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d5ad62]">Xem lá số đã lưu</a>
          </div>
          <dl className="mt-8 grid gap-4 border-t border-white/[0.07] pt-5 min-[520px]:grid-cols-3">
            {METHOD_POINTS.map(({ icon: Icon, label, description }) => (
              <div key={label} className="grid grid-cols-[20px_1fr] gap-x-2">
                <Icon className="mt-0.5 h-4 w-4 text-[#d5ad62]" aria-hidden="true" />
                <dt className="text-body-sm font-semibold text-[#f2eee5]">{label}</dt>
                <dd className="col-start-2 mt-0.5 text-caption leading-snug text-[#a6a7ac]">{description}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="relative mx-auto hidden aspect-square w-full max-w-[390px] desktop:block">
          <div className="absolute inset-[13%] rounded-full bg-[#d5ad62]/[0.06] blur-3xl" />
          <TuViAstrolabe className="h-full w-full drop-shadow-[0_18px_35px_rgba(0,0,0,0.5)] motion-safe:animate-[mv-orbit-spin_90s_linear_infinite] motion-reduce:animate-none" />
        </div>
      </div>
    </section>
  );
}
