import Link from 'next/link';
import { landingCopy } from '@/content/landing-copy';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

/** All four Discovery systems are real and live (Tarot Sprint 6, Numerology Sprint 8, Natal Chart
 * Sprint 9, Eastern Horoscope Sprint 17) — SEO + Shareability Foundation audit found this landing
 * page still marking Natal Chart/Eastern Horoscope `comingSoon: true` in `landing-copy.ts` and
 * corrected it (see docs/progress/seo-shareability-foundation-final-report.md). The `comingSoon`
 * badge/no-link behavior below is kept as real, future-proof handling for whatever system ships
 * next, not dead code. Each live system links to its own real route via `system.href` — never a
 * single hardcoded destination shared across every non-comingSoon card. */
export function DiscoverySystems() {
  return (
    <section id="discovery" aria-labelledby="discovery-heading" className="border-b border-border-subtle py-16 desktop:py-24">
      <div className="mx-auto max-w-content px-4 desktop:px-8">
        <h2 id="discovery-heading" className="mb-10 text-center font-display text-heading-lg text-text-primary">
          Discovery systems
        </h2>
        <div className="flex gap-4 overflow-x-auto pb-2 desktop:grid desktop:grid-cols-4 desktop:overflow-visible">
          {landingCopy.discoverySystems.map((system) => {
            const content = (
              <Card key={system.title} className="w-56 shrink-0 desktop:w-auto">
                <div className="mb-2 flex items-center justify-between">
                  <p className="font-display text-body-lg text-text-primary">{system.title}</p>
                  {system.comingSoon && <Badge>Coming soon</Badge>}
                </div>
                <p className="text-body-sm text-text-secondary">{system.description}</p>
              </Card>
            );
            return !system.comingSoon && system.href ? (
              <Link key={system.title} href={system.href} className="w-56 shrink-0 desktop:w-auto">
                {content}
              </Link>
            ) : (
              content
            );
          })}
        </div>
      </div>
    </section>
  );
}
