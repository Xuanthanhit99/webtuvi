import Image from 'next/image';
import { Bell, Mail, RefreshCw, ShieldCheck } from 'lucide-react';
import { HOME_MOBILE_VISUALS } from './production-assets';

const BENEFITS = [
  { icon: ShieldCheck, text: 'Luận giải chuyên sâu' },
  { icon: Bell, text: 'Nhắc nhở & dự báo mỗi ngày' },
  { icon: RefreshCw, text: 'Lưu trữ & đồng bộ đa thiết bị' },
] as const;

/**
 * Mệnh Vi doesn't ship a native mobile app yet — there's no real App Store/Google Play listing
 * to link to, so these render as inert badges (not `<a>` links to a real store URL), same
 * treatment as the "Soon" badge already used elsewhere in the shell (see Sidebar). Swap for real
 * store links the day a build actually ships.
 */
function StoreBadge({ label, sub }: { label: string; sub: string }) {
  return (
    <span className="inline-flex min-h-11 cursor-default items-center gap-2 rounded-md border border-white/15 bg-[#0b1220]/70 px-3.5 text-left text-[#d8d1c2]">
      <span className="flex flex-col leading-tight">
        <span className="text-[10px] uppercase tracking-[0.08em] text-[#a6a7ac]">{sub}</span>
        <span className="text-body-sm font-semibold text-[#f2eee5]">{label}</span>
      </span>
    </span>
  );
}

export function MobileAppPromo() {
  return (
    <section
      aria-labelledby="mobile-promo-heading"
      className="relative overflow-hidden rounded-[20px] border border-white/[0.06]"
      style={{ background: 'linear-gradient(155deg, #0d1626 0%, #0a1220 45%, #0c1420 100%)' }}
    >
      {/* Moody glow + a handful of static stars behind the phone stack — depth and atmosphere
          instead of a flat solid card, without repeating the hero/suggestions photo backgrounds
          a third time. */}
      <div
        className="pointer-events-none absolute left-[4%] top-1/2 h-[130%] w-[38%] -translate-y-1/2 opacity-80"
        style={{ background: 'radial-gradient(ellipse 60% 55% at 50% 50%, rgba(126,90,214,0.24), transparent 70%)' }}
        aria-hidden="true"
      />
      <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
        <circle cx="8%" cy="15%" r="1.2" fill="#f1e9db" opacity="0.4" />
        <circle cx="14%" cy="80%" r="1" fill="#f1e9db" opacity="0.3" />
        <circle cx="30%" cy="8%" r="1.4" fill="#e0bd72" opacity="0.35" />
        <circle cx="92%" cy="20%" r="1.2" fill="#f1e9db" opacity="0.35" />
        <circle cx="85%" cy="85%" r="1" fill="#a68df0" opacity="0.4" />
      </svg>

      <div className="relative grid gap-6 p-6 tablet:grid-cols-[minmax(220px,0.9fr)_1fr_auto] tablet:items-center tablet:gap-10 tablet:p-9">
        <div className="relative mx-auto aspect-[7/10] w-full max-w-[270px] overflow-hidden rounded-[18px] tablet:mx-0 tablet:max-w-[300px]">
          <Image
            src={HOME_MOBILE_VISUALS.appPromo}
            alt=""
            fill
            sizes="(max-width: 767px) 270px, 300px"
            className="object-cover object-center"
          />
          <div className="pointer-events-none absolute inset-0 rounded-[18px] ring-1 ring-inset ring-white/10" />
        </div>

        <div className="text-center tablet:text-left">
          <h2 id="mobile-promo-heading" className="font-display text-heading-md font-semibold text-[#f2eee5]">
            Mang Mệnh Vi theo bên mình
          </h2>
          <p className="mt-1.5 text-body-sm text-[#a6a7ac]">Ứng dụng Mệnh Vi đang được hoàn thiện cho trải nghiệm hằng ngày.</p>
          <ul className="mt-4 flex flex-col items-center gap-2 tablet:items-start">
            {BENEFITS.map((benefit) => (
              <li key={benefit.text} className="inline-flex items-center gap-2 text-body-sm text-[#d8d1c2]">
                <benefit.icon className="h-4 w-4 text-[#e6c980]" aria-hidden="true" />
                {benefit.text}
              </li>
            ))}
          </ul>
          <div className="mt-5 flex flex-wrap justify-center gap-3 tablet:justify-start">
            <StoreBadge sub="Sắp ra mắt trên" label="App Store" />
            <StoreBadge sub="Sắp ra mắt trên" label="Google Play" />
          </div>
        </div>

        <div className="mx-auto flex flex-col items-center gap-2 tablet:mx-0">
          <div className="flex h-24 w-24 items-center justify-center rounded-[14px] border border-white/15 bg-[#0b1220]/70">
            <Mail className="h-10 w-10 text-[#d8d1c2]" aria-hidden="true" />
          </div>
          <p className="max-w-[120px] text-center text-caption text-[#a6a7ac]">Nhận tin khi bản di động sẵn sàng</p>
        </div>
      </div>
    </section>
  );
}
