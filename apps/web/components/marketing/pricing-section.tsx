import Link from 'next/link';
import { landingCopy } from '@/content/landing-copy';
import { Card } from '@/components/ui/card';

export function PricingSection() {
  const { pricing } = landingCopy;
  return (
    <section id="pricing" aria-labelledby="pricing-heading" className="border-b border-border-subtle bg-surface py-16 desktop:py-24">
      <div className="mx-auto max-w-content px-4 desktop:px-8">
        <h2 id="pricing-heading" className="mb-10 text-center font-display text-heading-lg text-text-primary">
          Simple, honest pricing
        </h2>
        <div className="mx-auto grid max-w-2xl gap-6 desktop:grid-cols-2">
          <Card>
            <p className="font-display text-body-lg text-text-primary">{pricing.free.name}</p>
            <p className="mt-2 text-body-sm text-text-secondary">{pricing.free.description}</p>
          </Card>
          <Card className="border border-insight/30">
            <p className="font-display text-body-lg text-text-primary">{pricing.premium.name}</p>
            <p className="mt-2 text-body-sm text-text-secondary">{pricing.premium.description}</p>
          </Card>
        </div>
        <p className="mt-6 text-center text-body-sm text-text-secondary">{pricing.priceNote}</p>
        <div className="mt-8 text-center">
          <Link
            href="/register"
            className="inline-flex h-12 items-center justify-center rounded-md bg-insight px-6 text-body-md font-semibold text-canvas hover:bg-[#E2C27C] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-insight"
          >
            {pricing.cta}
          </Link>
        </div>
      </div>
    </section>
  );
}
