import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Terms of Service',
  description: 'The terms governing your use of Tử Vi Tarot.',
  path: '/terms',
});

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-reading px-4 py-16 desktop:px-8">
      <h1 className="mb-6 font-display text-heading-lg text-text-primary">Terms of Service</h1>
      <div className="flex flex-col gap-4 text-body-md text-text-secondary">
        <p>
          Tử Vi Tarot is a reflection companion. It is not a medical, psychological, or financial advice service,
          and it does not diagnose or treat any condition. If you&rsquo;re in crisis, please contact a local emergency
          service or a crisis line in your region.
        </p>
        <p>
          By creating an account, you agree to use Tử Vi Tarot in good faith and not to misuse the service to
          harm others.
        </p>
        <p className="text-body-sm text-text-tertiary">
          This is a placeholder summary for Sprint 1. Complete legal Terms of Service will be published before
          general availability.
        </p>
      </div>
    </div>
  );
}
