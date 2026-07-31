import type { Metadata } from 'next';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = { title: 'Discover' };

const SYSTEMS = [
  { title: 'Tarot', description: 'A card, a moment of reflection.' },
  { title: 'Natal Chart', description: 'What your chart says about how you move through the world.' },
  { title: 'Eastern Horoscope', description: 'An old lens on a familiar question: who am I, really?' },
  { title: 'Numerology', description: 'The numbers already in your life, given a second look.' },
];

export default function DiscoverPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-heading-lg text-text-primary">Discover</h1>
      <p className="text-body-sm text-text-secondary">
        Tarot, your chart, your numbers — Discovery Hub is on its way.
      </p>
      <div className="grid gap-4 desktop:grid-cols-2">
        {SYSTEMS.map((system) => (
          <Card key={system.title}>
            <div className="mb-2 flex items-center justify-between">
              <p className="font-display text-body-lg text-text-primary">{system.title}</p>
              <Badge>Coming soon</Badge>
            </div>
            <p className="text-body-sm text-text-secondary">{system.description}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
