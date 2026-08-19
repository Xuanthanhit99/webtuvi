import type { NatalAspectDto } from '@beaconvie/types';
import { EmptyState } from '@/components/ui/empty-state';
import { ASPECT_TYPE_LABELS, PLANET_GLYPHS, PLANET_LABELS } from '../labels';

const ANGLE_LABELS: Record<string, string> = { ascendant: 'Ascendant', midheaven: 'Midheaven' };

function pointLabel(point: string): string {
  if (point in PLANET_LABELS) return PLANET_LABELS[point as keyof typeof PLANET_LABELS];
  return ANGLE_LABELS[point] ?? point;
}

function pointGlyph(point: string): string | null {
  return point in PLANET_GLYPHS ? PLANET_GLYPHS[point as keyof typeof PLANET_GLYPHS] : null;
}

/** Phase 4/17 — key aspects, the most technically dense layer, deepest in the progressive-
 * disclosure hierarchy (Module 13 §4). Real, deterministic aspect data + fixed traditional
 * meaning only. */
export function AspectList({ aspects }: { aspects: NatalAspectDto[] }) {
  if (aspects.length === 0) {
    return <EmptyState title="No major aspects" description="No major aspects were found between this chart’s placements." />;
  }

  const sorted = [...aspects].sort((a, b) => a.orb - b.orb);

  return (
    <ul className="flex flex-col gap-2" aria-label="Aspects">
      {sorted.map((aspect, index) => (
        <li key={index} className="flex flex-col gap-1 rounded-md border border-border-subtle bg-surface p-3">
          <div className="flex flex-wrap items-center gap-2 text-body-sm">
            <span className="font-semibold text-text-primary">
              {pointGlyph(aspect.pointA) && (
                <span aria-hidden="true" className="mr-1 text-insight">
                  {pointGlyph(aspect.pointA)}
                </span>
              )}
              {pointLabel(aspect.pointA)}
            </span>
            <span className="text-text-secondary">{ASPECT_TYPE_LABELS[aspect.type]}</span>
            <span className="font-semibold text-text-primary">
              {pointGlyph(aspect.pointB) && (
                <span aria-hidden="true" className="mr-1 text-insight">
                  {pointGlyph(aspect.pointB)}
                </span>
              )}
              {pointLabel(aspect.pointB)}
            </span>
            <span className="text-caption text-text-tertiary">orb {aspect.orb.toFixed(1)}°</span>
          </div>
          <p className="text-body-sm text-text-secondary">{aspect.meaning}</p>
        </li>
      ))}
    </ul>
  );
}
