import { CheckCircle2, XCircle } from 'lucide-react';
import { landingCopy } from '@/content/landing-copy';

export function TrustSection() {
  const { trust } = landingCopy;
  return (
    <section aria-labelledby="trust-heading" className="border-b border-border-subtle bg-surface py-16">
      <h2 id="trust-heading" className="sr-only">
        What Mệnh Vi is and isn&rsquo;t
      </h2>
      <div className="mx-auto grid max-w-content gap-8 px-4 desktop:grid-cols-2 desktop:px-8">
        <div>
          <p className="mb-4 text-body-sm font-semibold uppercase tracking-wide text-text-secondary">
            {trust.notTitle}
          </p>
          <ul className="flex flex-col gap-3">
            {trust.not.map((item) => (
              <li key={item} className="flex items-start gap-2 text-body-md text-text-secondary">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-caution" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-4 text-body-sm font-semibold uppercase tracking-wide text-insight">{trust.areTitle}</p>
          <ul className="flex flex-col gap-3">
            {trust.are.map((item) => (
              <li key={item} className="flex items-start gap-2 text-body-md text-text-primary">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-trust" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
