import { landingCopy } from '@/content/landing-copy';
import { Constellation } from './constellation';

export function MemorySection() {
  return (
    <section aria-labelledby="memory-heading" className="relative overflow-hidden border-b border-border-subtle py-16 desktop:py-24">
      <Constellation density="medium" />
      <div className="relative mx-auto max-w-reading px-4 text-center desktop:px-8">
        <h2 id="memory-heading" className="sr-only">
          Memory, proven
        </h2>
        <p className="text-heading-md font-display text-text-primary">{landingCopy.memory.text}</p>
        <div className="mx-auto mt-10 max-w-md space-y-2 text-body-sm text-text-secondary">
          <p>{landingCopy.reportsLine}</p>
          <p>{landingCopy.communityLine}</p>
        </div>
      </div>
    </section>
  );
}
