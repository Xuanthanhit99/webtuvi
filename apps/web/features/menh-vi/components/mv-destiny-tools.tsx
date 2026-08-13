import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { MvAssetPlaceholder } from './mv-asset-placeholder';
import { mvDestinyTools } from '../data/mock-dashboard';

export function MvDestinyTools() {
  return (
    <section>
      <div className="flex items-center gap-3">
        <span className="h-px w-5 bg-mv-gold/50" aria-hidden="true" />
        <p className="text-body-sm font-semibold uppercase tracking-[0.2em] text-mv-gold">Khám phá vận mệnh</p>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4 mv-wide:grid-cols-4">
        {mvDestinyTools.map((tool) => (
          <Link
            key={tool.key}
            href={tool.href}
            className="group relative flex flex-col items-start overflow-hidden rounded-xl border border-mv-gold/15 bg-mv-elevated p-5 transition-colors duration-fast hover:border-mv-gold/35"
          >
            <div
              className="pointer-events-none absolute left-1/2 top-6 h-24 w-24 -translate-x-1/2 rounded-full bg-mv-violet/15 blur-2xl"
              aria-hidden="true"
            />
            {tool.asset.ready ? (
              <div className="relative mx-auto h-24 w-24 transition-transform duration-standard group-hover:scale-105 tablet:h-28 tablet:w-28 mv-wide:h-36 mv-wide:w-36">
                <Image
                  src={`/assets/menh-vi/features/${tool.asset.filename}`}
                  alt=""
                  fill
                  sizes="144px"
                  className="object-contain"
                />
              </div>
            ) : (
              <MvAssetPlaceholder
                filename={tool.asset.filename}
                width={tool.asset.width}
                height={tool.asset.height}
                className="mx-auto h-24 w-24"
                rounded="rounded-lg"
              />
            )}

            <div className="relative z-10 mt-3 w-full">
              <h3 className="text-balance font-display text-heading-md tracking-tight text-mv-text desktop:text-heading-lg">
                {tool.title}
              </h3>
              <p className="mt-1 text-body-sm text-mv-text-secondary">{tool.tagline}</p>
            </div>
            <span className="relative z-10 mt-3 flex h-9 w-9 items-center justify-center rounded-full border border-mv-border text-mv-text-secondary transition-colors duration-fast group-hover:border-mv-gold group-hover:text-mv-gold">
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
