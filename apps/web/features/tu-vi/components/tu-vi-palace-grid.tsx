import type { TuViChartDto } from '@beaconvie/types';
import { PALACE_ROLE_LABELS_EN, DIGNITY_SHORT_LABEL } from '../labels';
import { buildPalaceCells, orderFromMenh, PALACE_GRID_POSITION, type PalaceCell } from '../tu-vi-projection';

/** Vietnamese abbreviations for the 4 Tứ Hóa transformations, shown as a small superscript-style
 * tag next to the star they attach to — matches how printed lá số charts annotate them. */
const TRANSFORMATION_TAG: Record<string, string> = {
  'Hóa Lộc': 'L',
  'Hóa Quyền': 'Q',
  'Hóa Khoa': 'K',
  'Hóa Kỵ': 'K.',
};

/** Tags `star` only with the transformation(s) that actually name it as `targetStar` — never a
 * transformation merely co-located in the same palace (a real Tử Vi lá số palace routinely holds
 * 2+ stars; tagging every star in the palace with any transformation present would misattribute
 * it). The authoritative Tứ Hóa list is also rendered separately below the grid regardless. */
function starTags(star: string, cell: PalaceCell): string[] {
  return cell.transformations.filter((t) => t.targetStar === star).map((t) => TRANSFORMATION_TAG[t.transformation] ?? t.transformation);
}

function PalaceCard({ cell, size = 'normal' }: { cell: PalaceCell; size?: 'normal' | 'compact' }) {
  const roleLabelEn = PALACE_ROLE_LABELS_EN[cell.role];
  const markers = [cell.isMenh && 'Mệnh', cell.isThan && 'Thân'].filter(Boolean) as string[];

  return (
    <div
      role="group"
      aria-label={`${cell.role} palace, at ${cell.branch}${markers.length ? `, ${markers.join(' and ')}` : ''}`}
      className={`flex h-full flex-col gap-1 rounded-md border p-2 ${
        cell.isMenh ? 'border-insight bg-insight/5' : cell.isThan ? 'border-trust bg-trust/5' : 'border-border-subtle bg-surface'
      } ${size === 'compact' ? 'text-caption' : 'text-body-xs'}`}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="font-semibold text-text-primary">{cell.role}</span>
        <span className="text-text-tertiary">{cell.branch}</span>
      </div>
      <span className="text-text-tertiary">{roleLabelEn}</span>

      {markers.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {markers.map((m) => (
            <span key={m} className={`rounded-sm px-1 py-0.5 text-[0.65rem] font-medium ${m === 'Mệnh' ? 'bg-insight/15 text-insight' : 'bg-trust/15 text-trust'}`}>
              {m}
            </span>
          ))}
        </div>
      )}

      {cell.mainStars.length > 0 && (
        <ul className="flex flex-col gap-0.5">
          {cell.mainStars.map(({ star, dignity }) => {
            const tags = starTags(star, cell);
            return (
              <li key={star} className="font-medium text-text-primary">
                {star}
                <span className="ml-1 text-[0.65rem] font-normal text-text-tertiary" aria-label={`dignity: ${dignity}`}>
                  ({DIGNITY_SHORT_LABEL[dignity]})
                </span>
                {tags.length > 0 && <sup className="ml-0.5 text-insight">{tags.join('')}</sup>}
              </li>
            );
          })}
        </ul>
      )}

      {cell.auxiliaryStars.length > 0 && (
        <ul className="flex flex-wrap gap-x-1 text-text-secondary">
          {cell.auxiliaryStars.map((star) => {
            const tags = starTags(star, cell);
            return (
              <li key={star}>
                {star}
                {tags.length > 0 && <sup className="ml-0.5 text-insight">{tags.join('')}</sup>}
              </li>
            );
          })}
        </ul>
      )}

      {(cell.hasTuan || cell.hasTriet) && (
        <div className="mt-auto flex flex-wrap gap-1 pt-1">
          {cell.hasTuan && <span className="rounded-sm bg-surface-raised px-1 py-0.5 text-[0.65rem] text-text-secondary">Tuần</span>}
          {cell.hasTriet && <span className="rounded-sm bg-surface-raised px-1 py-0.5 text-[0.65rem] text-text-secondary">Triệt</span>}
        </div>
      )}
    </div>
  );
}

function ChartSummaryCell({ chart }: { chart: TuViChartDto }) {
  return (
    <div className="flex h-full flex-col justify-center gap-1 rounded-md border border-border-subtle bg-surface-raised p-2 text-center text-body-xs">
      <p className="font-display text-body-sm text-text-primary">Lá Số Tử Vi</p>
      <p className="text-text-secondary">
        {chart.canChi.year.stem} {chart.canChi.year.branch} · {chart.sex}
      </p>
      <p className="text-text-secondary">{chart.cuc}</p>
      <p className="text-text-tertiary">
        Giờ {chart.hourBranch} · {chart.lunarDate.lunarDay}/{chart.lunarDate.lunarMonth}
        {chart.lunarDate.isLeapMonth ? ' (nhuận)' : ''}/{chart.lunarDate.lunarYear} âm lịch
      </p>
    </div>
  );
}

/**
 * Sprint 18B.11 — the 12-palace lá số visualization. Every cell is a real, directly legible DOM
 * element with visible text (Vietnamese palace name + English gloss + branch + stars) — not a
 * decorative graphic with a separate hidden text equivalent, since the traditional grid layout is
 * already inherently tabular and accessible. `tablet:` and up shows the classic 4×4 grid (12
 * palaces around a blank center reserved for chart identity); below that, the same 12 palaces
 * render as a single-column list in clockwise reading order starting from Mệnh — no information is
 * lost, and a narrow-viewport reader gets a more legible single-column read rather than a cramped
 * shrunk grid.
 */
export function TuViPalaceGrid({ chart }: { chart: TuViChartDto }) {
  const cells = buildPalaceCells(chart);
  const stackedOrder = orderFromMenh(cells);

  return (
    <div>
      {/* tablet+ : the traditional 4×4 grid — listed first in DOM order since it's the primary
          representation; narrow viewports fall back to the stacked list below via CSS only, so a
          `.first()` query (tests, assistive tech landmark order) resolves to the visible one. */}
      <div className="hidden tablet:grid tablet:aspect-square tablet:grid-cols-4 tablet:grid-rows-4 tablet:gap-1.5" aria-label="12 palaces, traditional lá số grid layout">
        {cells.map((cell) => {
          const pos = PALACE_GRID_POSITION[cell.branch];
          return (
            <div key={cell.branch} style={{ gridRow: pos.row, gridColumn: pos.col }}>
              <PalaceCard cell={cell} size="compact" />
            </div>
          );
        })}
        <div style={{ gridRow: '2 / span 2', gridColumn: '2 / span 2' }}>
          <ChartSummaryCell chart={chart} />
        </div>
      </div>

      {/* Narrow viewports: stacked list, clockwise from Mệnh. */}
      <ul className="flex flex-col gap-2 tablet:hidden" aria-label="12 palaces, in clockwise order starting from Mệnh">
        {stackedOrder.map((cell) => (
          <li key={cell.branch}>
            <PalaceCard cell={cell} />
          </li>
        ))}
      </ul>
    </div>
  );
}
