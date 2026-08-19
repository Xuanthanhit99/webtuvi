import Link from 'next/link';
import { landingCopy } from '@/content/landing-copy';
import { ShareButton } from './share-button';

export function FinalCta() {
  return (
    <section aria-labelledby="final-cta-heading" className="py-20 text-center">
      <h2 id="final-cta-heading" className="mx-auto max-w-lg font-display text-heading-lg text-text-primary">
        {landingCopy.finalCta.text}
      </h2>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/register"
          className="inline-flex h-12 items-center justify-center rounded-md bg-insight px-6 text-body-md font-semibold text-canvas hover:bg-[#E2C27C] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-insight"
        >
          {landingCopy.finalCta.cta}
        </Link>
        <ShareButton />
      </div>
    </section>
  );
}
