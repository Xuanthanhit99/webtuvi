import { landingCopy } from '@/content/landing-copy';
import { Badge } from '@/components/ui/badge';

export function CompanionPreview() {
  const { companion } = landingCopy;
  return (
    <section aria-labelledby="companion-heading" className="border-b border-border-subtle bg-surface py-16 desktop:py-24">
      <div className="mx-auto max-w-reading px-4 desktop:px-8">
        <h2 id="companion-heading" className="mb-8 text-center font-display text-heading-lg text-text-primary">
          {companion.label}
        </h2>
        <div className="flex flex-col gap-4">
          <div className="ml-auto max-w-sm rounded-lg rounded-tr-sm bg-surface-raised px-4 py-3 text-body-md text-text-primary">
            {companion.exampleUser}
          </div>
          <div className="max-w-md rounded-lg rounded-tl-sm bg-insight/10 px-4 py-3">
            <p className="font-display text-body-lg text-text-primary">{companion.exampleCompanion}</p>
            <Badge variant="insight" className="mt-3">
              {companion.memoryLabel}
            </Badge>
          </div>
        </div>
        <p className="mt-4 text-center text-caption text-text-tertiary">
          Example conversation. Your Companion remembers what you share and brings it back when it&rsquo;s relevant.
        </p>
      </div>
    </section>
  );
}
