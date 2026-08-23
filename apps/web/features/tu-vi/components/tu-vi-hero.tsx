import { CalendarCheck2, LayoutGrid, RefreshCw, ShieldCheck } from 'lucide-react';
import { DestinyOrbit } from '@/features/dashboard/components/home/destiny-orbit';

const TRUST_ROW = [
  { icon: ShieldCheck, label: 'Chính xác', description: 'Nguồn Vân Đằng Thái Thứ Lang 1956, minh bạch' },
  { icon: CalendarCheck2, label: 'Khoa học', description: 'Hệ quy tắc xác định, được kiểm thử' },
  { icon: LayoutGrid, label: 'Chi tiết', description: '12 cung, 14 chính tinh, phụ tinh đầy đủ' },
  { icon: RefreshCw, label: 'Chu kỳ vận mệnh', description: 'Đại Vận · Tiểu Hạn theo đúng lá số' },
] as const;

/**
 * Board 02 — Tử Vi landing hero. Reuses Home's `DestinyOrbit` (Board 01's signature decorative
 * celestial motif, already generic/system-agnostic and `aria-hidden`) rather than inventing a
 * second decorative graphic — same visual family, not a new one. The trust row states methodology
 * claims already substantiated by `TuViTrustSection`'s glossary/source disclosure below; it is not
 * user data and carries no numbers that could be mistaken for a calculated fact.
 */
export function TuViHero() {
  return (
    <section
      aria-labelledby="tu-vi-hero-heading"
      className="relative overflow-hidden rounded-[24px] border border-[rgba(213,173,98,0.16)] bg-[#070b12] px-5 py-8 shadow-[0_24px_80px_rgba(0,0,0,0.35)] tablet:px-8 tablet:py-10 desktop:px-12 desktop:py-12"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_15%,rgba(213,173,98,0.16),transparent_28%),radial-gradient(circle_at_82%_20%,rgba(112,140,121,0.14),transparent_30%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(circle,rgba(242,238,229,0.5)_1px,transparent_1.5px)] [background-size:42px_42px]" />

      <div className="relative z-10 grid gap-8 desktop:grid-cols-[minmax(0,1fr)_320px] desktop:items-center">
        <div className="max-w-xl">
          <p className="text-caption font-semibold uppercase tracking-[0.24em] text-[#e6c980]">Tử Vi Đẩu Số</p>
          <h1 id="tu-vi-hero-heading" className="mt-3 text-[clamp(2.25rem,6vw,3.4rem)] font-semibold leading-[1.02] text-[#f2eee5]">
            Lá số Tử Vi
          </h1>
          <p className="mt-5 max-w-md text-body-lg leading-relaxed text-[#d8d1c2]">
            Lập lá số thật từ ngày sinh, giờ sinh và giới tính của bạn. Cung, sao, dignity và Tứ Hóa đều đến từ một hệ
            quy tắc xác định — không phải nội dung do AI tạo ra.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href="#tu-vi-form"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#d5ad62] px-5 text-body-sm font-semibold text-[#070b12] transition-colors hover:bg-[#e6c980] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d5ad62]"
            >
              Lập lá số ngay
            </a>
          </div>

          <dl className="mt-9 grid grid-cols-2 gap-x-6 gap-y-5 tablet:grid-cols-4">
            {TRUST_ROW.map(({ icon: Icon, label, description }) => (
              <div key={label} className="flex flex-col gap-1.5">
                <Icon className="h-5 w-5 text-[#e6c980]" aria-hidden="true" />
                <dt className="text-body-sm font-semibold text-[#f2eee5]">{label}</dt>
                <dd className="text-caption leading-snug text-[#a6a7ac]">{description}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="mx-auto hidden w-full max-w-[280px] desktop:block">
          <DestinyOrbit className="h-full w-full drop-shadow-[0_0_28px_rgba(213,173,98,0.2)]" />
        </div>
      </div>
    </section>
  );
}
