import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'About' };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-reading px-4 py-16 desktop:px-8">
      <h1 className="mb-6 font-display text-heading-lg text-text-primary">About BeaconVie</h1>
      <p className="text-body-md text-text-secondary">
        BeaconVie is an AI Companion built around one idea: a relationship worth having has to remember you.
        We use tarot, astrology, and numerology as a way to get to know you — never as what we sell you — and
        we carry what you share forward, conversation after conversation, with your explicit control over what
        gets remembered and what doesn&rsquo;t.
      </p>
    </div>
  );
}
