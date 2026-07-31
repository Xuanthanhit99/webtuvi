import { landingCopy } from '@/content/landing-copy';

export function HowItWorks() {
  return (
    <section id="how-it-works" aria-labelledby="how-heading" className="border-b border-border-subtle bg-surface py-16 desktop:py-24">
      <div className="mx-auto max-w-content px-4 desktop:px-8">
        <h2 id="how-heading" className="mb-10 text-center font-display text-heading-lg text-text-primary">
          How it works
        </h2>
        <div className="grid gap-8 desktop:grid-cols-3">
          {landingCopy.howItWorks.steps.map((step) => (
            <div key={step.number} className="flex flex-col items-center gap-3 text-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-insight/15 font-display text-body-lg text-insight">
                {step.number}
              </span>
              <p className="text-body-md text-text-secondary">{step.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
