import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { ARTICLE_COVER_ASSET } from './production-assets';
import { trackEvent } from '@/lib/analytics';

/**
 * Static fallback — there is no articles/blog/CMS backend in this codebase yet (checked
 * apps/api/src/** and packages/types for an "article"/"blog"/"editorial" module; none exists).
 * These are illustrative editorial entries reusing the same production Discovery artwork as
 * cover images. Swap for a real content API once one ships — do not fabricate one here.
 */
/**
 * `objectPosition` deliberately differs from the Discovery card crop of the same source file
 * (which is centered) — a different slice of the same art plus the desaturated editorial
 * treatment below is the only way to avoid these reading as duplicated module cards without a
 * second commissioned asset per article.
 */
const ARTICLES = [
  { category: 'Tử Vi', title: 'Rằm tháng 7 âm lịch – Ý nghĩa và những điều cần biết', readTime: '5 phút đọc', asset: 'tu_vi', href: '/discover/tu-vi', objectPosition: '50% 20%' },
  { category: 'Tarot', title: 'Ý nghĩa 78 lá bài Tarot – Bộ môn đọc vị tâm hồn', readTime: '7 phút đọc', asset: 'tarot', href: '/discover/tarot', objectPosition: '50% 75%' },
  { category: 'Chiêm tinh', title: 'Các hành tinh trong chiêm tinh – Ảnh hưởng đến cuộc sống bạn', readTime: '6 phút đọc', asset: 'natal_chart', href: '/discover/natal-chart', objectPosition: '35% 40%' },
  { category: 'Thần số học', title: 'Thần số học là gì? Hướng dẫn cách tính và ý nghĩa', readTime: '6 phút đọc', asset: 'numerology', href: '/discover/numerology', objectPosition: '65% 30%' },
] as const;

export function ArticlesSection() {
  return (
    <section aria-labelledby="articles-heading" className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 id="articles-heading" className="font-display text-heading-md font-semibold text-[#f2eee5]">
          Bài viết nổi bật
        </h2>
        <Link href="/discover" className="inline-flex items-center gap-1.5 text-body-sm font-semibold text-[#e6c980]">
          Xem tất cả <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
      {/* Single column below ~400px — a 2-up grid at that width squeezed each 16:9 cover into a
          ~170px-wide sliver and forced titles to truncate after a couple of words. 2 columns from
          400px is fine (cards have real room again), 4 from desktop as before. */}
      <div className="grid grid-cols-1 gap-4 min-[400px]:grid-cols-2 desktop:grid-cols-4">
        {ARTICLES.map((article) => (
          <Link
            key={article.title}
            href={article.href}
            onClick={() => trackEvent('home_article_clicked', { feature: 'home', source: article.asset })}
            className="group overflow-hidden rounded-[16px] border border-white/10 bg-[#0c1420] transition-colors duration-standard hover:border-[#d5ad62]/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d5ad62]"
          >
            <div className="relative aspect-video overflow-hidden bg-[#0e1524]">
              {/* Goes through Next's optimizer, ready for the HD masters (see
                  production-assets.ts's HD replacement contract) — visually identical to today's
                  raw source (Next never upscales past native), but generates a correctly-sized
                  variant automatically once a real ~1200x675 cover lands at this same path. */}
              <Image
                src={ARTICLE_COVER_ASSET[article.asset]}
                alt=""
                fill
                sizes="(min-width: 1280px) 300px, 45vw"
                className="object-cover grayscale-[0.35] transition-transform duration-500 ease-organic group-hover:scale-[1.04]"
                style={{ objectPosition: article.objectPosition }}
              />
              {/* Editorial duotone — a warm-navy wash over the desaturated crop, distinct from the
                  Discovery cards' saturated module-identity glow. */}
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,rgba(18,26,44,0.55)_0%,rgba(10,15,26,0.25)_55%,transparent_100%)]" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#0c1420] via-[#0c1420]/40 to-transparent" />
            </div>
            <div className="p-4">
              <p className="text-caption font-semibold uppercase tracking-[0.12em] text-[#e6c980]">{article.category}</p>
              <h3 className="mt-1.5 line-clamp-2 text-body-sm font-semibold leading-relaxed text-[#f2eee5]">{article.title}</h3>
              <p className="mt-1.5 text-caption text-[#a6a7ac]">{article.readTime}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
