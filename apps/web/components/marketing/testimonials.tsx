import { landingCopy } from '@/content/landing-copy';
import { Card } from '@/components/ui/card';

export function Testimonials() {
  return (
    <section aria-labelledby="testimonials-heading" className="border-b border-border-subtle py-16 desktop:py-24">
      <div className="mx-auto max-w-content px-4 desktop:px-8">
        <h2 id="testimonials-heading" className="mb-10 text-center font-display text-heading-lg text-text-primary">
          What people notice
        </h2>
        <div className="grid gap-6 desktop:grid-cols-3">
          {landingCopy.testimonials.map((t) => (
            <Card key={t.quote}>
              <p className="text-body-md text-text-primary">&ldquo;{t.quote}&rdquo;</p>
              {/* Placeholder testimonial copy — disclosed in content/landing-copy.ts,
                  not rendered on-page per the "neutral, non-hyperbolic" requirement. */}
              <p className="mt-3 text-caption text-text-secondary">{t.attribution}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
