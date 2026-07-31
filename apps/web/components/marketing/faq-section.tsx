import { landingCopy } from '@/content/landing-copy';

export function FaqSection() {
  return (
    <section aria-labelledby="faq-heading" className="border-b border-border-subtle py-16 desktop:py-24">
      <div className="mx-auto max-w-reading px-4 desktop:px-8">
        <h2 id="faq-heading" className="mb-8 text-center font-display text-heading-lg text-text-primary">
          Frequently asked
        </h2>
        <div className="flex flex-col gap-2">
          {landingCopy.faq.map((item) => (
            <details key={item.question} className="group rounded-md border border-border-subtle px-4 py-3">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-body-md font-medium text-text-primary [&::-webkit-details-marker]:hidden">
                {item.question}
                <span aria-hidden="true" className="text-text-secondary group-open:rotate-180 transition-transform duration-standard">
                  ⌄
                </span>
              </summary>
              <p className="mt-2 text-body-sm text-text-secondary">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
