import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { buildMetadata, SITE_NAME, SITE_URL } from '@/lib/seo';
import { FEATURE_ART_ASSET } from '@/features/dashboard/components/home/production-assets';

const PAGES = {
  'eastern-horoscope': { title: 'Ngũ Hành Phương Đông', description: 'Khám phá con giáp, thiên can, địa chi và ngũ hành từ ngày sinh; phân biệt với lá số Tử Vi Đẩu Số.', eyebrow: 'Ngũ Hành Phương Đông', heading: 'Một lăng kính phương Đông từ ngày sinh', body: 'Mệnh Vi sử dụng ngày sinh để xác định con giáp, thiên can, địa chi và ngũ hành. Đây là hệ riêng, không phải lá số Tử Vi Đẩu Số và không dự đoán chắc chắn tương lai.', asset: 'tu_vi', target: '/discover/eastern-horoscope' },
  'tu-vi': { title: 'Tử Vi Đẩu Số', description: 'Tìm hiểu Tử Vi Đẩu Số và bắt đầu lập lá số từ ngày, giờ sinh trong Mệnh Vi.', eyebrow: 'Tử Vi Đẩu Số', heading: 'Lập lá số để nhìn toàn cảnh theo 12 cung', body: 'Mệnh Vi dựng lá số từ dữ liệu sinh theo hệ quy tắc cố định, sau đó trình bày các cung, sao và chu kỳ để bạn đọc từ tổng quan đến chi tiết.', asset: 'tu_vi', target: '/discover/tu-vi' },
  tarot: { title: 'Tarot 78 Lá', description: 'Khám phá Tarot 78 lá, chọn cách trải bài và lưu lại các lần soi chiếu trong Mệnh Vi.', eyebrow: 'Tarot', heading: 'Một khoảng lặng để nhìn rõ câu hỏi hiện tại', body: 'Chọn cách trải bài, giữ trong lòng điều bạn muốn soi chiếu và tự tay chọn các lá từ bộ bài 78 lá của Mệnh Vi.', asset: 'tarot', target: '/discover/tarot' },
  'ban-do-sao': { title: 'Bản Đồ Sao', description: 'Tìm hiểu Bản đồ sao và dựng biểu đồ từ ngày, giờ, địa điểm sinh trong Mệnh Vi.', eyebrow: 'Chiêm tinh phương Tây', heading: 'Bầu trời tại khoảnh khắc bạn sinh ra', body: 'Bản đồ sao sử dụng ngày, giờ và địa điểm sinh để xác định vị trí hành tinh, các nhà, cung mọc và các góc hợp.', asset: 'natal_chart', target: '/discover/natal-chart' },
  'than-so-hoc': { title: 'Thần Số Học', description: 'Khám phá sáu chỉ số Thần số học từ họ tên khai sinh và ngày sinh trong Mệnh Vi.', eyebrow: 'Thần số học', heading: 'Những con số kể câu chuyện riêng của bạn', body: 'Mệnh Vi tính sáu chỉ số cốt lõi từ họ tên khai sinh và ngày sinh, đồng thời hiển thị từng bước tính để bạn có thể xem lại.', asset: 'numerology', target: '/discover/numerology' },
} as const;

export type Slug = keyof typeof PAGES;
const DETAILS: Record<Slug, string> = {
  'tu-vi': 'Nhập ngày sinh, giờ sinh và giới tính để lập lá số. Bạn có thể đọc 12 cung, các sao, Đại Vận và Tiểu Hạn, lưu lá số và quay lại xem chi tiết. Độ đầy đủ của dữ liệu giờ sinh ảnh hưởng đến cách đọc lá số.',
  tarot: 'Chọn trải một lá, ba lá hoặc lá bài hôm nay từ bộ Tarot 78 lá. Đặt câu hỏi, chọn bài và đọc ý nghĩa theo vị trí trong trải bài. Bạn có thể lưu lại lần trải để suy ngẫm về sau; phần diễn giải không quyết định thay bạn.',
  'ban-do-sao': 'Chuẩn bị ngày, giờ và địa điểm sinh. Bản đồ sao thể hiện vị trí hành tinh, các nhà, góc hợp và các điểm ASC, MC. Giờ và nơi sinh ảnh hưởng đến cách xác định nhà và cung mọc; hãy kiểm tra dữ liệu trước khi tạo biểu đồ.',
  'than-so-hoc': 'Nhập họ tên khai sinh và ngày sinh để xem sáu chỉ số: Đường đời, Sứ mệnh, Linh hồn, Nhân cách, Trưởng thành và Ngày sinh. Hồ sơ hiển thị cách tính để bạn theo dõi nguồn gốc từng con số và xem lại kết quả đã lưu.',
  'eastern-horoscope': 'Nhập ngày sinh để xem con giáp và ngũ hành theo hệ quy chiếu phương Đông. Hồ sơ giải thích các thành phần can chi và ngũ hành; nếu muốn xem cấu trúc 12 cung cùng các sao, hãy chọn Tử Vi Lá Số trong Khám phá.',
};
export function createPublicSystemMetadata(slug: Slug): Metadata {
  const page = PAGES[slug];
  return buildMetadata({ title: page.title, description: page.description, path: page.target });
}
export function PublicSystemLanding({ slug }: { slug: Slug }) {
  const page = PAGES[slug];
  const jsonLd = { '@context': 'https://schema.org', '@type': 'WebPage', name: page.title, description: page.description, url: `${SITE_URL}${page.target}`, isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: SITE_URL } };
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
    <div className="mx-auto w-full max-w-[1280px]">
    <nav aria-label="Đường dẫn" className="mb-5 flex flex-wrap gap-2 text-body-sm text-text-secondary"><Link href="/" className="hover:underline">Trang chủ</Link><span aria-hidden="true">/</span><Link href="/discover" className="hover:underline">Khám phá</Link><span aria-hidden="true">/</span><span aria-current="page">{page.title}</span></nav>
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
    <section aria-labelledby="system-details-heading" className="mx-auto max-w-4xl pb-10">
      <h2 id="system-details-heading" className="font-serif text-heading-md">Bạn bắt đầu như thế nào?</h2>
      <p className="mt-4 text-body-md leading-relaxed text-text-secondary">{DETAILS[slug]}</p>
      <p className="mt-3 text-body-sm leading-relaxed text-text-secondary">Các diễn giải là góc nhìn để tự khám phá và suy ngẫm, không phải kết luận khoa học hay lời khuyên y tế, pháp lý hoặc tài chính. Kết quả cá nhân chỉ được xem trong tài khoản của bạn.</p>
      <Link href="/discover" className="mt-5 inline-flex min-h-11 items-center text-body-sm font-semibold text-[#e6c980] hover:underline">Khám phá các hệ khác</Link>
    </section>
    </div>
  </>;
}
