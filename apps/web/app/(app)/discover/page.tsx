import type { Metadata } from 'next';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = { title: 'Discover' };

/** Tarot (Sprint 6), Numerology (Sprint 8), and Natal Chart (Sprint 9) are real. Eastern
 * Horoscope stays honestly labeled "Coming soon" — never claimed as available until it actually
 * is (see docs/audit/web-tu-vi-remediation-roadmap.md). */
const SYSTEMS = [
  { title: 'Tarot', description: 'A real, deterministic 78-card draw — no card ever chosen or invented by AI.', href: '/discover/tarot', available: true },
  {
    title: 'Natal Chart',
    description: 'A real, deterministic birth chart calculated from your birth date, time, and place — what it says about how you move through the world.',
    href: '/discover/natal-chart',
    available: true,
  },
  { title: 'Eastern Horoscope', description: 'An old lens on a familiar question: who am I, really?', available: false },
  {
    title: 'Numerology',
    description: 'The numbers already in your life, given a second look — no number ever chosen or invented by AI.',
    href: '/discover/numerology',
    available: true,
  },
];

export default function DiscoverPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-heading-lg text-text-primary">Discover</h1>
      <p className="text-body-sm text-text-secondary">Tarot, Numerology, and Natal Chart are live. Your horoscope is on its way.</p>
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
