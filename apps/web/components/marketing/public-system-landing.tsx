import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { buildMetadata } from '@/lib/seo';
import { FEATURE_ART_ASSET } from '@/features/dashboard/components/home/production-assets';

const PAGES = {
  'tu-vi': { title: 'Tử Vi Đẩu Số', description: 'Tìm hiểu Tử Vi Đẩu Số và bắt đầu lập lá số từ ngày, giờ sinh trong Mệnh Vi.', eyebrow: 'Tử Vi Đẩu Số', heading: 'Lập lá số để nhìn toàn cảnh theo 12 cung', body: 'Mệnh Vi dựng lá số từ dữ liệu sinh theo hệ quy tắc cố định, sau đó trình bày các cung, sao và chu kỳ để bạn đọc từ tổng quan đến chi tiết.', asset: 'tu_vi', target: '/discover/tu-vi' },
  tarot: { title: 'Tarot 78 Lá', description: 'Khám phá Tarot 78 lá, chọn cách trải bài và lưu lại các lần soi chiếu trong Mệnh Vi.', eyebrow: 'Tarot', heading: 'Một khoảng lặng để nhìn rõ câu hỏi hiện tại', body: 'Chọn cách trải bài, giữ trong lòng điều bạn muốn soi chiếu và tự tay chọn các lá từ bộ bài 78 lá của Mệnh Vi.', asset: 'tarot', target: '/discover/tarot' },
  'ban-do-sao': { title: 'Bản Đồ Sao', description: 'Tìm hiểu Bản đồ sao và dựng biểu đồ từ ngày, giờ, địa điểm sinh trong Mệnh Vi.', eyebrow: 'Chiêm tinh phương Tây', heading: 'Bầu trời tại khoảnh khắc bạn sinh ra', body: 'Bản đồ sao sử dụng ngày, giờ và địa điểm sinh để xác định vị trí hành tinh, các nhà, cung mọc và các góc hợp.', asset: 'natal_chart', target: '/discover/natal-chart' },
  'than-so-hoc': { title: 'Thần Số Học', description: 'Khám phá sáu chỉ số Thần số học từ họ tên khai sinh và ngày sinh trong Mệnh Vi.', eyebrow: 'Thần số học', heading: 'Những con số kể câu chuyện riêng của bạn', body: 'Mệnh Vi tính sáu chỉ số cốt lõi từ họ tên khai sinh và ngày sinh, đồng thời hiển thị từng bước tính để bạn có thể xem lại.', asset: 'numerology', target: '/discover/numerology' },
} as const;

type Slug = keyof typeof PAGES;
export function createPublicSystemMetadata(slug: Slug): Metadata {
  const page = PAGES[slug];
  return buildMetadata({ title: page.title, description: page.description, path: `/${slug}` });
}
export function PublicSystemLanding({ slug }: { slug: Slug }) {
  const page = PAGES[slug];
  const jsonLd = { '@context': 'https://schema.org', '@type': 'WebPage', name: page.title, description: page.description, url: `/${slug}`, isPartOf: { '@type': 'WebSite', name: 'Mệnh Vi', url: '/' } };
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
    <main className="mx-auto w-full max-w-[1280px] px-4 py-8 tablet:px-8 tablet:py-12">
    <section className="relative isolate min-h-[430px] overflow-hidden rounded-[22px] border border-[#d5ad62]/20 bg-[#080d16] px-5 py-9 tablet:px-10 tablet:py-12 desktop:px-14">
      <Image src={FEATURE_ART_ASSET[page.asset]} alt="" fill priority sizes="(min-width: 1280px) 1280px, 100vw" className="-z-10 object-cover object-center opacity-45" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-[#080d16] via-[#080d16]/92 to-[#080d16]/35" />
      <div className="relative flex min-h-[350px] max-w-2xl flex-col justify-center">
        <p className="text-caption font-semibold uppercase tracking-[0.22em] text-[#e6c980]">{page.eyebrow}</p>
        <h1 className="mt-3 font-serif text-heading-xl leading-tight text-text-primary tablet:text-display-sm">{page.heading}</h1>
        <p className="mt-5 max-w-xl text-body-md leading-relaxed text-text-secondary">{page.body}</p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href={`/register?next=${encodeURIComponent(page.target)}`} className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[#d5ad62] px-5 text-body-sm font-semibold text-[#17120a]">Bắt đầu miễn phí <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
          <Link href={`/login?next=${encodeURIComponent(page.target)}`} className="inline-flex min-h-11 items-center rounded-md border border-white/15 px-5 text-body-sm font-semibold text-text-primary">Đã có tài khoản</Link>
        </div>
      </div>
    </section>
    <section className="mx-auto grid max-w-4xl gap-5 py-12 tablet:grid-cols-3">
      {['Dữ liệu rõ ràng', 'Kết quả có thể xem lại', 'Không thay thế tư vấn chuyên môn'].map((x) => <div key={x} className="rounded-xl border border-white/10 bg-surface p-5"><ShieldCheck className="h-5 w-5 text-[#d5ad62]" aria-hidden="true" /><h2 className="mt-3 font-serif text-heading-sm text-text-primary">{x}</h2></div>)}
    </section>
    </main>
  </>;
}
