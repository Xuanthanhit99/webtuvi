import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Compass, Layers3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AnalyticsPageView } from '@/components/analytics/analytics-page-view';
import { FEATURE_ART_ASSET } from '@/features/dashboard/components/home/production-assets';

export const metadata: Metadata = {
  title: 'Khám Phá',
  description: 'Chọn một hệ quy chiếu phù hợp để khám phá bản thân qua Tử Vi, Tarot, Bản đồ sao, Thần số học và Ngũ Hành Phương Đông.',
};

const SYSTEMS = [
  { key: 'tu_vi', title: 'Tử Vi Lá Số', question: 'Bức tranh vận trình của mình được cấu thành như thế nào?', description: 'Lập lá số Tử Vi Đẩu Số từ ngày, giờ sinh và giới tính theo hệ quy tắc truyền thống đã được kiểm chứng.', href: '/discover/tu-vi', accent: 'text-[#d9b06c]' },
  { key: 'tarot', title: 'Tarot', question: 'Điều gì cần được nhìn rõ trong khoảnh khắc này?', description: 'Chọn một trải bài và lắng nghe góc nhìn được mở ra từ bộ bài 78 lá.', href: '/discover/tarot', accent: 'text-[#c3a2d9]' },
  { key: 'natal_chart', title: 'Bản Đồ Sao', question: 'Bầu trời lúc mình sinh ra nói gì về khí chất và cách kết nối?', description: 'Dựng bản đồ sao phương Tây từ ngày, giờ và địa điểm sinh.', href: '/discover/natal-chart', accent: 'text-[#91b9dc]' },
  { key: 'numerology', title: 'Thần Số Học', question: 'Những con số nào đang kể câu chuyện riêng của mình?', description: 'Khám phá sáu chỉ số cốt lõi từ họ tên khai sinh và ngày sinh.', href: '/discover/numerology', accent: 'text-[#c79ade]' },
] as const;

const PATHS = [
  { step: '01', title: 'Nhìn vào cấu trúc', description: 'Bắt đầu với Tử Vi hoặc Bản đồ sao khi bạn muốn thấy một chân dung nhiều lớp.', links: [{ label: 'Lập lá số Tử Vi', href: '/discover/tu-vi' }, { label: 'Dựng Bản đồ sao', href: '/discover/natal-chart' }] },
  { step: '02', title: 'Gọi tên điều cốt lõi', description: 'Thần số học cô đọng họ tên và ngày sinh thành một hồ sơ dễ đi sâu từng phần.', links: [{ label: 'Khám phá Thần số học', href: '/discover/numerology' }] },
  { step: '03', title: 'Trở về hiện tại', description: 'Tarot phù hợp khi bạn đang mang một câu hỏi và cần thêm một góc nhìn để suy ngẫm.', links: [{ label: 'Rút bài Tarot', href: '/discover/tarot' }] },
] as const;

export default function DiscoverPage() {
  return (
    <main className="flex flex-col gap-12 pb-12">
      <AnalyticsPageView event="discover_viewed" properties={{ feature: 'discover' }} />

      <header className="relative isolate overflow-hidden rounded-xl border border-[rgba(213,173,98,0.18)] bg-[#080d18] px-5 py-8 tablet:px-9 tablet:py-11 desktop:px-12">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_82%_16%,rgba(86,110,163,0.2),transparent_25%),radial-gradient(circle_at_72%_76%,rgba(114,66,137,0.16),transparent_28%),linear-gradient(135deg,rgba(8,15,27,0.98),rgba(11,13,25,0.9))]" />
        <div className="grid items-end gap-8 tablet:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="max-w-3xl">
            <p className="text-caption font-semibold uppercase tracking-[0.24em] text-[#d5ad62]">Khám phá</p>
            <h1 className="mt-3 font-serif text-heading-xl leading-tight text-text-primary tablet:text-display-sm">Một câu hỏi, nhiều cách để hiểu mình</h1>
            <p className="mt-4 max-w-2xl text-body-md leading-relaxed text-text-secondary">Mỗi hệ quy chiếu soi sáng một lớp khác nhau: cấu trúc cuộc đời, khí chất, những con số cốt lõi hay câu hỏi của hiện tại. Hãy bắt đầu từ điều đang khiến bạn tò mò nhất.</p>
          </div>
          <div className="flex items-center gap-3 border-l border-[#d5ad62]/20 pl-5 text-body-sm text-text-secondary"><Compass className="h-8 w-8 shrink-0 text-[#d5ad62]" aria-hidden="true" /><p>Không cần chọn “đúng”. Chỉ cần chọn điều gần với câu hỏi của bạn hôm nay.</p></div>
        </div>
      </header>

      <section aria-labelledby="systems-heading">
        <div className="mb-5 flex items-end justify-between gap-4"><div><p className="text-caption font-semibold uppercase tracking-[0.18em] text-[#d5ad62]">Các hệ khám phá</p><h2 id="systems-heading" className="mt-1 font-serif text-heading-lg text-text-primary">Bạn muốn nhìn vào điều gì?</h2></div><span className="hidden text-caption text-text-tertiary tablet:block">4 hệ quy chiếu cốt lõi</span></div>
        <div className="grid gap-4 tablet:grid-cols-2 desktop:grid-cols-[1.15fr_1fr_1fr]">
          {SYSTEMS.map((system, index) => (
            <Link key={system.title} href={system.href} className={`group relative isolate min-h-[18rem] overflow-hidden rounded-xl border border-white/10 bg-[#0a101c] p-5 transition-colors hover:border-[#d5ad62]/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d5ad62] tablet:p-7 ${index === 0 ? 'desktop:row-span-2 desktop:min-h-[37rem]' : ''} ${index === 3 ? 'desktop:col-span-2' : ''}`}>
              <Image src={FEATURE_ART_ASSET[system.key]} alt="" fill sizes={index === 0 ? '(min-width: 1536px) 390px, (min-width: 1280px) 31vw, (min-width: 768px) 50vw, 100vw' : '(min-width: 1536px) 420px, (min-width: 1280px) 31vw, (min-width: 768px) 50vw, 100vw'} className="-z-10 object-cover opacity-55 transition duration-700 ease-organic group-hover:scale-[1.025] group-hover:opacity-65" />
              <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-t from-[#080d18] via-[#080d18]/72 to-transparent" />
              <div className="flex h-full flex-col justify-end">
                <p className={`text-caption font-semibold uppercase tracking-[0.18em] ${system.accent}`}>{String(index + 1).padStart(2, '0')}</p>
                <h3 className="mt-2 font-serif text-heading-md text-text-primary">{system.title}</h3>
                <p className="mt-2 max-w-xl text-body-md font-medium leading-relaxed text-text-primary">{system.question}</p>
                <p className="mt-2 max-w-xl text-body-sm leading-relaxed text-text-secondary">{system.description}</p>
                <span className="mt-5 inline-flex min-h-11 items-center gap-2 self-start text-body-sm font-semibold text-[#e6c980]">Bắt đầu khám phá <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" /></span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="eastern-heading" className="relative overflow-hidden rounded-xl border border-[#d5ad62]/18 bg-[linear-gradient(110deg,#111522,#15111c)] p-5 tablet:p-8">
        <div className="grid items-center gap-6 tablet:grid-cols-[minmax(0,1fr)_auto]">
          <div><p className="text-caption font-semibold uppercase tracking-[0.18em] text-[#d5ad62]">Một lăng kính khác</p><h2 id="eastern-heading" className="mt-2 font-serif text-heading-md text-text-primary">Ngũ Hành Phương Đông</h2><p className="mt-3 max-w-2xl text-body-sm leading-relaxed text-text-secondary">Khám phá con giáp và ngũ hành từ ngày sinh. Đây là một hệ riêng, không phải lá số Tử Vi Đẩu Số.</p></div>
          <Link href="/discover/eastern-horoscope" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-[#d5ad62]/30 px-4 text-body-sm font-semibold text-[#e6c980] hover:bg-[#d5ad62]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d5ad62]">Khám phá Ngũ Hành <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
        </div>
      </section>

      <section aria-labelledby="paths-heading">
        <div className="mb-5"><p className="text-caption font-semibold uppercase tracking-[0.18em] text-[#d5ad62]">Gợi ý bắt đầu</p><h2 id="paths-heading" className="mt-1 font-serif text-heading-lg text-text-primary">Đi theo câu hỏi của bạn</h2><p className="mt-2 max-w-2xl text-body-sm text-text-secondary">Ba lộ trình biên tập từ những công cụ đang có — không phải đề xuất cá nhân hóa.</p></div>
        <ol className="divide-y divide-white/10 border-y border-white/10">
          {PATHS.map((path) => <li key={path.step} className="grid gap-3 py-5 tablet:grid-cols-[3rem_minmax(0,1fr)_minmax(15rem,auto)] tablet:items-center"><span className="font-serif text-heading-md text-[#d5ad62]/65">{path.step}</span><div><h3 className="font-serif text-heading-sm text-text-primary">{path.title}</h3><p className="mt-1 max-w-2xl text-body-sm text-text-secondary">{path.description}</p></div><div className="flex flex-wrap gap-x-4 gap-y-2 tablet:justify-end">{path.links.map((link) => <Link key={link.href} href={link.href} className="inline-flex min-h-11 items-center gap-1 text-body-sm font-semibold text-[#e6c980] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d5ad62]">{link.label} <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></Link>)}</div></li>)}
        </ol>
      </section>

      <section aria-labelledby="report-heading" className="rounded-xl border border-[#8f78b5]/20 bg-[radial-gradient(circle_at_85%_30%,rgba(99,74,139,0.18),transparent_26%),#0b101d] p-5 tablet:p-8">
        <div className="grid items-center gap-5 tablet:grid-cols-[auto_minmax(0,1fr)_auto]"><Layers3 className="h-10 w-10 text-[#bca1d5]" aria-hidden="true" /><div><div className="flex flex-wrap items-center gap-2"><h2 id="report-heading" className="font-serif text-heading-md text-text-primary">Báo Cáo Vận Mệnh</h2><Badge variant="insight">Premium</Badge></div><p className="mt-2 max-w-2xl text-body-sm leading-relaxed text-text-secondary">Khi đã có Bản đồ sao và hồ sơ Thần số học, bạn có thể kết nối hai nguồn dữ liệu thành một bản luận giải dài.</p></div><Link href="/reports" className="inline-flex min-h-11 items-center gap-2 text-body-sm font-semibold text-[#e6c980] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d5ad62]">Xem báo cáo <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></div>
      </section>
    </main>
  );
}
