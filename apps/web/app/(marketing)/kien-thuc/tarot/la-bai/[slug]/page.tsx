import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SITE_NAME, SITE_URL, buildMetadata } from '@/lib/seo';
import {
  TAROT_CARD_SEO_PATH,
  tarotArcanaLabel,
  tarotCardBySlug,
  tarotCardDescription,
  tarotCardTitle,
  tarotRelatedCards,
  tarotSeoCards,
} from '@/features/knowledge/tarot-cards';

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return tarotSeoCards.map((card) => ({ slug: card.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const card = tarotCardBySlug(slug);
  if (!card) return {};
  return buildMetadata({
    title: tarotCardTitle(card),
    description: tarotCardDescription(card),
    path: `${TAROT_CARD_SEO_PATH}/${card.slug}`,
    type: 'article',
  });
}

export default async function TarotCardKnowledgePage({ params }: Props) {
  const { slug } = await params;
  const card = tarotCardBySlug(slug);
  if (!card) notFound();

  const path = `${TAROT_CARD_SEO_PATH}/${card.slug}`;
  const url = `${SITE_URL}${path}`;
  const related = tarotRelatedCards(card);
  const article = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: tarotCardTitle(card),
    description: tarotCardDescription(card),
    datePublished: '2026-09-26',
    dateModified: '2026-09-26',
    mainEntityOfPage: url,
    author: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
  };
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Kiến thức', item: `${SITE_URL}/kien-thuc` },
      { '@type': 'ListItem', position: 2, name: 'Kiến thức Tarot', item: `${SITE_URL}/kien-thuc/tarot` },
      { '@type': 'ListItem', position: 3, name: '78 lá Tarot', item: `${SITE_URL}/kien-thuc/tarot/y-nghia-78-la-tarot` },
      { '@type': 'ListItem', position: 4, name: card.nameVi, item: url },
    ],
  };

  return (
    <article className="mx-auto min-w-0 max-w-3xl px-4 py-10 sm:px-6 lg:py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(article) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <nav className="text-sm text-muted-foreground">
        <Link href="/kien-thuc">Kiến thức</Link> / <Link href="/kien-thuc/tarot">Tarot</Link> / <Link href="/kien-thuc/tarot/y-nghia-78-la-tarot">78 lá Tarot</Link>
      </nav>
      <header className="mt-6">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">{tarotArcanaLabel(card)}</p>
        <h1 className="mt-3 break-words text-4xl font-semibold leading-tight sm:text-5xl">{card.nameVi} ({card.name})</h1>
        <p className="mt-5 text-lg leading-8 text-muted-foreground">{tarotCardDescription(card)}</p>
      </header>

      <div className="mt-10 space-y-9 text-[17px] leading-8">
        <section>
          <h2 className="text-2xl font-semibold">Ý nghĩa xuôi</h2>
          <p className="mt-3 text-muted-foreground">{card.uprightMeaning}</p>
          <p className="mt-3"><strong>Từ khóa:</strong> {card.uprightKeywords.join(', ')}.</p>
        </section>
        <section>
          <h2 className="text-2xl font-semibold">Ý nghĩa ngược</h2>
          <p className="mt-3 text-muted-foreground">{card.reversedMeaning}</p>
          <p className="mt-3"><strong>Từ khóa:</strong> {card.reversedKeywords.join(', ')}.</p>
        </section>
        <section>
          <h2 className="text-2xl font-semibold">Tình yêu và các mối quan hệ</h2>
          <p className="mt-3 text-muted-foreground">{card.loveMeaning}</p>
        </section>
        <section>
          <h2 className="text-2xl font-semibold">Công việc và sự nghiệp</h2>
          <p className="mt-3 text-muted-foreground">{card.careerMeaning}</p>
        </section>
        <section>
          <h2 className="text-2xl font-semibold">Tài chính</h2>
          <p className="mt-3 text-muted-foreground">{card.financeMeaning}</p>
        </section>
        <section>
          <h2 className="text-2xl font-semibold">Góc nhìn cho bản thân</h2>
          <p className="mt-3 text-muted-foreground">{card.selfMeaning}</p>
        </section>
        <section>
          <h2 className="text-2xl font-semibold">Câu hỏi để tự chiêm nghiệm</h2>
          <ul className="mt-3 list-disc space-y-2 pl-6 text-muted-foreground">
            {card.reflectionPrompts.map((prompt) => <li key={prompt}>{prompt}</li>)}
          </ul>
        </section>
      </div>

      <section className="mt-12 border-t border-border pt-8">
        <h2 className="text-2xl font-semibold">Khám phá các lá liên quan</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {related.map((item) => (
            <Link key={item.slug} href={`${TAROT_CARD_SEO_PATH}/${item.slug}`} className="rounded-xl border border-border p-4">
              <h3 className="font-semibold">{item.nameVi} ({item.name})</h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{tarotArcanaLabel(item)}</p>
            </Link>
          ))}
        </div>
      </section>

      <aside className="mt-12 rounded-2xl border border-border bg-card p-6">
        <p className="font-semibold">Trải nghiệm lá bài trong một câu hỏi của riêng bạn</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Ý nghĩa Tarot mang tính biểu tượng và tham khảo. Hãy đặt lá bài vào bối cảnh câu hỏi thực tế thay vì xem nó như một dự đoán chắc chắn.</p>
        <Link href="/discover/tarot" className="mt-5 inline-flex rounded-xl bg-foreground px-5 py-3 font-semibold text-background">Rút bài Tarot</Link>
      </aside>
    </article>
  );
}
