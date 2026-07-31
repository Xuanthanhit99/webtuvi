import { ShieldCheck, Lock } from 'lucide-react';
import { landingCopy } from '@/content/landing-copy';

export function PrivacySection() {
  const { security } = landingCopy;
  return (
    <section id="privacy" aria-labelledby="privacy-heading" className="border-b border-border-subtle bg-surface py-16">
      <div className="mx-auto max-w-content px-4 desktop:px-8">
        <h2 id="privacy-heading" className="mb-8 text-center font-display text-heading-lg text-text-primary">
          Your privacy. Your choice. Always.
        </h2>
        <div className="mx-auto grid max-w-2xl gap-6 desktop:grid-cols-2">
          <p className="flex items-start gap-3 text-body-md text-text-secondary">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-insight" aria-hidden="true" />
            {security.privacy}
          </p>
          <p className="flex items-start gap-3 text-body-md text-text-secondary">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-insight" aria-hidden="true" />
            {security.security}
          </p>
        </div>
      </div>
    </section>
  );
}
