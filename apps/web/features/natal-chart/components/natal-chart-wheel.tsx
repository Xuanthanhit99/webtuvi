import type { NatalChartDto } from '@beaconvie/types';
import { ASPECT_TYPE_LINE_STYLE, PLANET_GLYPHS, SIGN_GLYPHS, SIGN_ORDER } from '../labels';

const SIZE = 320;
const CENTER = SIZE / 2;
const OUTER_R = 148;
const SIGN_RING_INNER_R = 122;
const HOUSE_LINE_R = 122;
const PLANET_BASE_R = 100;
const ASPECT_R = 84;
const ANGLE_LABEL_R = 68;

const ASPECT_LINE_COLOR: Record<'harmonious' | 'tense' | 'neutral', string> = {
  harmonious: '#7E9787',
  tense: '#C17B6B',
  neutral: '#9A7FA6',
};

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function pointOnCircle(radius: number, screenAngleDeg: number): { x: number; y: number } {
  const rad = toRad(screenAngleDeg);
  return { x: CENTER + radius * Math.cos(rad), y: CENTER - radius * Math.sin(rad) };
}

/** Ecliptic longitude -> screen angle. When the Ascendant is known, it's anchored at the
 * standard 9-o'clock (left) position and the wheel reads counterclockwise as longitude
 * increases — the conventional Western chart-wheel orientation. Without a known Ascendant
 * (birth time unknown, or an extreme birth latitude), 0° Aries anchors the 3-o'clock position
 * instead — an arbitrary but consistent, still fully deterministic fallback layout. */
function makeLongitudeToScreenAngle(chart: NatalChartDto): (longitude: number) => number {
  const referenceLongitude = chart.ascendant ? chart.ascendant.longitude : 0;
  const referenceScreenAngle = chart.ascendant ? 180 : 0;
  return (longitude: number) => referenceScreenAngle + (longitude - referenceLongitude);
}

/** Simple collision easing: planets within 7° of a previously-placed one nudge outward in
 * alternating steps so glyphs don't fully overlap at a tight conjunction. Not a full
 * astrological collision-avoidance algorithm — a disclosed, deliberately modest visual
 * simplification (docs/architecture/natal-chart-discovery.md). */
function planetRadii(sortedLongitudes: number[]): number[] {
  const radii: number[] = [];
  let step = 0;
  for (let i = 0; i < sortedLongitudes.length; i++) {
    const prev = sortedLongitudes[i - 1];
    const close = i > 0 && prev !== undefined && Math.min(Math.abs(sortedLongitudes[i]! - prev), 360 - Math.abs(sortedLongitudes[i]! - prev)) < 7;
    step = close ? step + 1 : 0;
    radii.push(PLANET_BASE_R - (step % 3) * 14);
  }
  return radii;
}

/**
 * Phase 16 — the chart wheel visualization. Purely derived from already-calculated,
 * already-persisted chart data (`chart.placements`/`houses`/`aspects`/`ascendant`/`midheaven`) —
 * no calculation happens here, and nothing here is AI-generated. Decorative/visual only: the
 * real, screen-reader-accessible equivalent is the Big Three summary, planet/house/aspect lists
 * rendered alongside it (Module 13 §20's "fully accessible textual/tabular equivalent"
 * requirement), so every element inside the SVG is `aria-hidden`.
 */
export function NatalChartWheel({ chart }: { chart: NatalChartDto }) {
  const longitudeToScreenAngle = makeLongitudeToScreenAngle(chart);

  const sortedPlacements = [...chart.placements].sort((a, b) => a.longitude - b.longitude);
  const radii = planetRadii(sortedPlacements.map((p) => p.longitude));

  const ascLabel = chart.ascendant ? `Ascendant in ${chart.ascendant.sign}` : 'Ascendant unavailable';
  const summaryLabel = `Natal chart wheel. Sun in ${chart.placements.find((p) => p.body === 'sun')?.sign ?? 'unknown'}, Moon in ${
    chart.placements.find((p) => p.body === 'moon')?.sign ?? 'unknown'
  }. ${ascLabel}. Full details are listed in the sections below.`;

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={summaryLabel} className="mx-auto w-full max-w-[24rem]">
      <g aria-hidden="true">
        {/* outer + sign ring boundary */}
        <circle cx={CENTER} cy={CENTER} r={OUTER_R} fill="none" stroke="#332F52" strokeWidth={1} />
        <circle cx={CENTER} cy={CENTER} r={SIGN_RING_INNER_R} fill="none" stroke="#332F52" strokeWidth={1} />
        <circle cx={CENTER} cy={CENTER} r={ASPECT_R} fill="none" stroke="#332F52" strokeWidth={0.5} />

        {/* 12 sign segments: boundary ticks + glyphs */}
        {SIGN_ORDER.map((sign, index) => {
          const startLongitude = index * 30;
          const boundaryAngle = longitudeToScreenAngle(startLongitude);
          const boundaryOuter = pointOnCircle(OUTER_R, boundaryAngle);
          const boundaryInner = pointOnCircle(SIGN_RING_INNER_R, boundaryAngle);
          const glyphAngle = longitudeToScreenAngle(startLongitude + 15);
          const glyphPoint = pointOnCircle((OUTER_R + SIGN_RING_INNER_R) / 2, glyphAngle);
          return (
            <g key={sign}>
              <line x1={boundaryInner.x} y1={boundaryInner.y} x2={boundaryOuter.x} y2={boundaryOuter.y} stroke="#332F52" strokeWidth={1} />
              <text x={glyphPoint.x} y={glyphPoint.y} textAnchor="middle" dominantBaseline="central" fontSize={13} fill="#B7AFC9">
                {SIGN_GLYPHS[sign]}
              </text>
            </g>
          );
        })}

        {/* house cusps, only when available */}
        {chart.housesAvailable &&
          chart.houses.map((house) => {
            const angle = longitudeToScreenAngle(house.cuspLongitude);
            const outer = pointOnCircle(HOUSE_LINE_R, angle);
            const labelPoint = pointOnCircle(ANGLE_LABEL_R, angle);
            return (
              <g key={house.number}>
                <line x1={CENTER} y1={CENTER} x2={outer.x} y2={outer.y} stroke="#332F52" strokeWidth={0.5} strokeDasharray="2 3" />
                <text x={labelPoint.x} y={labelPoint.y} textAnchor="middle" dominantBaseline="central" fontSize={9} fill="#6E6785">
                  {house.number}
                </text>
              </g>
            );
          })}

        {/* aspect lines */}
        {chart.aspects.map((aspect, index) => {
          const pointLongitude = (key: string): number | undefined => {
            if (key === 'ascendant') return chart.ascendant?.longitude;
            if (key === 'midheaven') return chart.midheaven?.longitude;
            return chart.placements.find((p) => p.body === key)?.longitude;
          };
          const lonA = pointLongitude(aspect.pointA);
          const lonB = pointLongitude(aspect.pointB);
          if (lonA === undefined || lonB === undefined) return null;
          const a = pointOnCircle(ASPECT_R, longitudeToScreenAngle(lonA));
          const b = pointOnCircle(ASPECT_R, longitudeToScreenAngle(lonB));
          return (
            <line
              key={index}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={ASPECT_LINE_COLOR[ASPECT_TYPE_LINE_STYLE[aspect.type]]}
              strokeWidth={1}
              opacity={0.45}
            />
          );
        })}

        {/* Ascendant / Midheaven markers */}
        {chart.ascendant &&
          (() => {
            const angle = longitudeToScreenAngle(chart.ascendant.longitude);
            const outer = pointOnCircle(OUTER_R + 10, angle);
            const inner = pointOnCircle(SIGN_RING_INNER_R - 10, angle);
            return (
              <g>
                <line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke="#E3B368" strokeWidth={1.5} />
                <text x={outer.x} y={outer.y} textAnchor="middle" dominantBaseline="central" fontSize={9} fontWeight={600} fill="#E3B368">
                  ASC
                </text>
              </g>
            );
          })()}
        {chart.midheaven &&
          (() => {
            const angle = longitudeToScreenAngle(chart.midheaven.longitude);
            const outer = pointOnCircle(OUTER_R + 10, angle);
            const inner = pointOnCircle(SIGN_RING_INNER_R - 10, angle);
            return (
              <g>
                <line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke="#E3B368" strokeWidth={1} strokeDasharray="1 2" />
                <text x={outer.x} y={outer.y} textAnchor="middle" dominantBaseline="central" fontSize={9} fontWeight={600} fill="#E3B368">
                  MC
                </text>
              </g>
            );
          })()}

        {/* planets */}
        {sortedPlacements.map((placement, index) => {
          const angle = longitudeToScreenAngle(placement.longitude);
          const point = pointOnCircle(radii[index]!, angle);
          return (
            <g key={placement.body}>
              <circle cx={point.x} cy={point.y} r={9} fill="#1F1C36" stroke="#E3B368" strokeWidth={1} />
              <text x={point.x} y={point.y} textAnchor="middle" dominantBaseline="central" fontSize={11} fill="#F1ECE4">
                {PLANET_GLYPHS[placement.body]}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}
