import type { Metadata } from 'next';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AnalyticsPageView } from '@/components/analytics/analytics-page-view';

export const metadata: Metadata = { title: 'Discover' };

/** Tarot (Sprint 6), Numerology (Sprint 8), and Natal Chart (Sprint 9, displayed as "Bản Đồ Sao"
 * per docs/product/vietnamese-tu-vi-product-definition.md §1) are real. Eastern Horoscope
 * (Ngũ Hành Phương Đông — Chinese Zodiac/Five Elements) stays honestly labeled "Coming soon" and
 * is a distinct, separate module from the future, not-yet-built Tử Vi Lá Số — never conflate the
 * two (see docs/product/vietnamese-tu-vi-product-definition.md §1). */
const SYSTEMS = [
  { title: 'Tarot', description: 'A real, deterministic 78-card draw — no card ever chosen or invented by AI.', href: '/discover/tarot', available: true },
  {
    title: 'Bản Đồ Sao',
    description: 'A real, deterministic Western birth chart calculated from your birth date, time, and place — what it says about how you move through the world.',
    href: '/discover/natal-chart',
    available: true,
  },
  {
    title: 'Ngũ Hành Phương Đông',
    description: 'Chinese Zodiac and Five Elements — an old lens on a familiar question: who am I, really? (Not Vietnamese Tử Vi Lá Số, a separate future module.)',
    available: false,
  },
  {
    title: 'Thần Số Học',
    description: 'The numbers already in your life, given a second look — no number ever chosen or invented by AI.',
    href: '/discover/numerology',
    available: true,
  },
];

export default function DiscoverPage() {
  return (
    <div className="flex flex-col gap-6">
      <AnalyticsPageView event="discover_viewed" properties={{ feature: 'discover' }} />
      <h1 className="font-display text-heading-lg text-text-primary">Discover</h1>
      <p className="text-body-sm text-text-secondary">Tarot, Thần Số Học, and Bản Đồ Sao are live. Ngũ Hành Phương Đông is on its way.</p>
      <div className="grid gap-4 desktop:grid-cols-2">
        {SYSTEMS.map((system) => (
          <Card key={system.title}>
            <div className="mb-2 flex items-center justify-between">
              <p className="font-display text-body-lg text-text-primary">{system.title}</p>
              {!system.available && <Badge>Coming soon</Badge>}
            </div>
            <p className="mb-3 text-body-sm text-text-secondary">{system.description}</p>
            {system.available && system.href && (
              <Link href={system.href}>
                <Button variant="secondary" size="sm">
                  Try {system.title}
                </Button>
              </Link>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
