import { MvHero } from '@/features/menh-vi/components/mv-hero';
import { MvSpotlightCard } from '@/features/menh-vi/components/mv-spotlight-card';
import { MvDimensionGrid } from '@/features/menh-vi/components/mv-dimension-grid';
import { MvEventsList } from '@/features/menh-vi/components/mv-events-list';
import { MvDestinyTools } from '@/features/menh-vi/components/mv-destiny-tools';
import { MvTarotTeaser } from '@/features/menh-vi/components/mv-tarot-teaser';
import { MvCompatibilityCard } from '@/features/menh-vi/components/mv-compatibility-card';
import { MvLifeTimeline } from '@/features/menh-vi/components/mv-life-timeline';
import { MvStarMapCta } from '@/features/menh-vi/components/mv-star-map-cta';

export default function MenhViHomePage() {
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-3 tablet:px-6 tablet:py-8">
      <div className="grid gap-5 tablet:gap-6 desktop:grid-cols-[1fr_320px]">
        <div className="flex min-w-0 flex-col gap-5 tablet:gap-8">
          <MvHero />

          <MvDestinyTools />

          <section className="grid gap-4 tablet:grid-cols-[1.2fr_1fr_1.2fr]">
            <MvTarotTeaser />
            <MvCompatibilityCard />
            <MvLifeTimeline />
          </section>
        </div>

        <aside className="flex flex-col gap-4">
          <MvSpotlightCard />
          <MvDimensionGrid />
          <MvEventsList />
          <MvStarMapCta />
        </aside>
      </div>
    </div>
  );
}
