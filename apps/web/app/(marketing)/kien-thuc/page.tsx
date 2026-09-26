import Link from 'next/link';
import { buildMetadata } from '@/lib/seo';
import { ARTICLES, CLUSTERS } from '@/features/knowledge/content';

export const metadata = buildMetadata({ title: 'Kiến thức Tử Vi, Tarot, Thần số học & Bản đồ sao', description: 'Thư viện kiến thức Mệnh Vi: Tử Vi, Tarot, Thần số học, Bản đồ sao và Ngũ hành, có liên kết trực tiếp tới công cụ thực hành.', path: '/kien-thuc' });

export default function KnowledgePage() {
  return <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-16">
    <header className="max-w-3xl"><p className="text-sm font-semibold uppercase tracking-[.18em] text-accent">Thư viện Mệnh Vi</p><h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Kiến thức để hiểu trước khi luận giải</h1><p className="mt-5 text-lg leading-8 text-muted-foreground">Nền tảng rõ ràng về Tử Vi, Tarot, Thần số học, Bản đồ sao và Ngũ hành. Mỗi chủ đề đều dẫn tới công cụ tương ứng để bạn tự khám phá dữ liệu của mình.</p></header>
    <section className="mt-10 grid gap-4 md:grid-cols-2">{Object.entries(CLUSTERS).map(([slug,c])=><Link key={slug} href={`/kien-thuc/${slug}`} className="rounded-2xl border border-border bg-card p-6 transition hover:-translate-y-0.5 hover:shadow-sm"><h2 className="text-xl font-semibold">{c.title}</h2><p className="mt-2 leading-7 text-muted-foreground">{c.description}</p><span className="mt-4 inline-block text-sm font-semibold">Xem chủ đề →</span></Link>)}</section>
    <section className="mt-14"><h2 className="text-2xl font-semibold">Bài mới</h2><div className="mt-5 grid gap-4 md:grid-cols-2">{ARTICLES.slice(0,6).map(a=><Link key={a.slug} href={`/kien-thuc/${a.cluster}/${a.slug}`} className="rounded-xl border border-border p-5"><h3 className="font-semibold">{a.title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{a.description}</p></Link>)}</div></section>
  </div>;
}
