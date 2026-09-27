import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { buildMetadata } from '@/lib/seo';
import { articlesByCluster, CLUSTERS, type KnowledgeCluster } from '@/features/knowledge/content';
import { TAROT_CARD_SEO_PATH, tarotSeoCards } from '@/features/knowledge/tarot-cards';
import {
  TU_VI_PALACE_SEO_PATH,
  TU_VI_STAR_SEO_PATH,
  tuViPalaceSeo,
  tuViStarSeo,
} from '@/features/knowledge/tu-vi-seo';

type Props = { params: Promise<{ cluster: string }> };

export function generateStaticParams() {
  return Object.keys(CLUSTERS).map((cluster) => ({ cluster }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { cluster } = await params;
  const c = CLUSTERS[cluster as KnowledgeCluster];
  if (!c) return {};
  return buildMetadata({ title: c.title, description: c.description, path: `/kien-thuc/${cluster}` });
}

function TuViDirectory() {
  return (
    <section className="mt-12" aria-labelledby="tu-vi-directory-heading">
      <h2 id="tu-vi-directory-heading" className="text-2xl font-semibold">Tra cứu 12 cung và hệ thống sao</h2>
      <p className="mt-3 leading-7 text-muted-foreground">Đi trực tiếp tới từng cung hoặc từng sao đang có trong phạm vi kiến thức Tử Vi của Mệnh Vi.</p>
      <h3 className="mt-7 text-lg font-semibold">12 cung</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {tuViPalaceSeo.map((item) => (
          <Link key={item.slug} href={`${TU_VI_PALACE_SEO_PATH}/${item.slug}`} className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted">
            Cung {item.name}
          </Link>
        ))}
      </div>
      <h3 className="mt-7 text-lg font-semibold">Các sao trong bộ quy tắc hiện tại</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {tuViStarSeo.map((item) => (
          <Link key={item.slug} href={`${TU_VI_STAR_SEO_PATH}/${item.slug}`} className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted">
            Sao {item.name}
          </Link>
        ))}
      </div>
    </section>
  );
}

function TarotDirectory() {
  return (
    <section className="mt-12" aria-labelledby="tarot-directory-heading">
      <h2 id="tarot-directory-heading" className="text-2xl font-semibold">Tra cứu 78 lá Tarot</h2>
      <p className="mt-3 leading-7 text-muted-foreground">Mở từng lá để xem nội dung tiếng Việt về ý nghĩa xuôi, ngược và các góc nhìn theo bối cảnh.</p>
      <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {tarotSeoCards.map((card) => (
          <Link key={card.slug} href={`${TAROT_CARD_SEO_PATH}/${card.slug}`} className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted">
            {card.nameVi} <span className="text-muted-foreground">({card.name})</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default async function ClusterPage({ params }: Props) {
  const { cluster } = await params;
  const c = CLUSTERS[cluster as KnowledgeCluster];
  if (!c) notFound();
  const articles = articlesByCluster(cluster as KnowledgeCluster);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:py-16">
      <nav className="text-sm text-muted-foreground"><Link href="/kien-thuc">Kiến thức</Link> / {c.title}</nav>
      <h1 className="mt-5 text-4xl font-semibold">{c.title}</h1>
      <p className="mt-4 text-lg leading-8 text-muted-foreground">{c.description}</p>
      <p className="mt-4 leading-7 text-muted-foreground">Bắt đầu từ các khái niệm nền tảng, sau đó đi sâu vào từng thành phần và cách đọc kết quả. Nội dung được trình bày để bạn hiểu phương pháp trước khi sử dụng công cụ, đồng thời phân biệt dữ liệu được tính toán với phần diễn giải mang tính tham khảo.</p>
      <div className="mt-9 space-y-4">
        {articles.map((a) => (
          <Link key={a.slug} href={`/kien-thuc/${cluster}/${a.slug}`} className="block rounded-2xl border border-border p-6">
            <h2 className="text-xl font-semibold">{a.title}</h2>
            <p className="mt-2 leading-7 text-muted-foreground">{a.description}</p>
          </Link>
        ))}
      </div>
      {cluster === 'tu-vi' && <TuViDirectory />}
      {cluster === 'tarot' && <TarotDirectory />}
      <Link href={c.toolHref} className="mt-10 inline-flex rounded-xl bg-foreground px-5 py-3 font-semibold text-background">Mở công cụ {c.title.replace('Kiến thức ', '')}</Link>
    </div>
  );
}
