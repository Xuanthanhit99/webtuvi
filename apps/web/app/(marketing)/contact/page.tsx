import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Contact',
  description: 'Get in touch with the Tử Vi Tarot team with questions or feedback.',
  path: '/contact',
});

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-reading px-4 py-16 desktop:px-8">
      <h1 className="mb-6 font-display text-heading-lg text-text-primary">Contact</h1>
      <p className="text-body-md text-text-secondary">
        Questions or feedback? Reach us at{' '}
        <a href="mailto:hello@beaconvie.local" className="text-insight underline">
          hello@beaconvie.local
        </a>
        .
      </p>
    </div>
  );
}
