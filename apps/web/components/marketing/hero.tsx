import Link from 'next/link';
import { landingCopy } from '@/content/landing-copy';
import { Constellation } from './constellation';

export function Hero() {
  const { hero } = landingCopy;
  const [before, after] = hero.headline.split(hero.headlineHighlight);

  return (
    <section className="relative overflow-hidden border-b border-border-subtle py-20 desktop:py-32">
      <Constellation density="high" />
      <div className="relative mx-auto flex max-w-content flex-col items-center px-4 text-center desktop:px-8">
        <h1 className="max-w-3xl font-display text-display-lg text-text-primary desktop:text-display-xl">
          {before}
          <span className="text-insight">{hero.headlineHighlight}</span>
          {after}
        </h1>
        <p className="mt-6 max-w-xl text-body-lg text-text-secondary">{hero.subheadline}</p>
        <div className="mt-8 flex flex-col items-center gap-4 desktop:flex-row">
          <Link
            href="/register"
            className="inline-flex h-12 items-center justify-center rounded-md bg-insight px-6 text-body-md font-semibold text-canvas hover:bg-[#E2C27C] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-insight"
          >
            {hero.primaryCta}
          </Link>
          <a
            href="#how-it-works"
            className="inline-flex h-12 items-center justify-center rounded-md px-6 text-body-md text-text-secondary hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-insight"
          >
            {hero.secondaryCta}
          </a>
        </div>
      </div>
    </section>
  );
}
