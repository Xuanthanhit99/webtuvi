'use client';

import { useState } from 'react';
import type { EarthlyBranchValue, TuViChartDto } from '@beaconvie/types';
import { ChevronRight } from 'lucide-react';
import { DIGNITY_SHORT_LABEL } from '../labels';
import { buildPalaceCells, PALACE_GRID_POSITION, type PalaceCell } from '../tu-vi-projection';

const TRANSFORMATION_TAG: Record<string, string> = { 'Hóa Lộc': 'L', 'Hóa Quyền': 'Q', 'Hóa Khoa': 'K', 'Hóa Kỵ': 'K.' };
const DIGNITY_TONE: Record<string, string> = {
  'Miếu địa': 'bg-insight/20 text-insight',
  'Vượng địa': 'bg-insight/15 text-insight',
  'Đắc địa': 'bg-trust/15 text-trust',
  'Bình hòa': 'bg-surface-raised text-text-secondary',
  'Hãm địa': 'bg-caution/15 text-caution',
};

function starTags(star: string, cell: PalaceCell): string[] {
  return cell.transformations.filter((item) => item.targetStar === star).map((item) => TRANSFORMATION_TAG[item.transformation] ?? item.transformation);
}

function PalaceButton({ cell, selected, compact = false, onSelect }: { cell: PalaceCell; selected: boolean; compact?: boolean; onSelect: () => void }) {
  const markers = [cell.isMenh && 'Mệnh', cell.isThan && 'Thân'].filter(Boolean) as string[];
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={`${cell.role} palace, at ${cell.branch}${markers.length ? `, ${markers.join(' and ')}` : ''}`}
      className={`group flex h-full w-full flex-col rounded-md border text-left transition-[border-color,background-color,transform] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d5ad62] ${selected ? 'border-[#d5ad62] bg-[#d5ad62]/[0.08]' : cell.isThan ? 'border-[#708c79]/45 bg-[#708c79]/[0.04]' : 'border-[#d5ad62]/15 bg-[#0b1220] hover:border-[#d5ad62]/40'} ${compact ? 'min-h-[76px] p-2' : 'p-2.5'}`}
    >
      <span className="flex w-full items-start justify-between gap-1">
        <span className={`font-display font-semibold text-[#f2eee5] ${compact ? 'text-caption' : 'text-body-sm'}`}>{cell.role}</span>
        <span className="text-caption text-[#777b83]">{cell.branch}</span>
      </span>
      {markers.length > 0 && <span className="mt-1 text-[0.65rem] font-semibold text-[#e6c980]">{markers.join(' · ')}</span>}
      {!compact && cell.mainStars.length > 0 && (
        <ul className="mt-2 space-y-1">
          {cell.mainStars.map(({ star, dignity }) => (
            <li key={star} className="flex flex-wrap items-center gap-1">
              <span className="text-caption font-semibold text-[#f2eee5]">{star}</span>
              <span className={`rounded-sm px-1 py-0.5 text-[0.58rem] font-semibold leading-none ${DIGNITY_TONE[dignity] ?? 'bg-surface-raised text-text-secondary'}`} aria-label={`dignity: ${dignity}`}>{DIGNITY_SHORT_LABEL[dignity]}</span>
              {starTags(star, cell).length > 0 && <sup className="text-[#e6c980]">{starTags(star, cell).join('')}</sup>}
            </li>
          ))}
        </ul>
      )}
      {!compact && cell.auxiliaryStars.length > 0 && <p className="mt-1 text-[0.67rem] leading-snug text-[#a6a7ac]">{cell.auxiliaryStars.join(' · ')}</p>}
      {compact && <span className="mt-auto flex w-full items-end justify-between gap-1 pt-2 text-[0.65rem] text-[#a6a7ac]"><span>{cell.mainStars.length ? `${cell.mainStars.length} chính tinh` : 'Vô chính diệu'}</span><ChevronRight className="h-3 w-3" aria-hidden="true" /></span>}
      {!compact && (cell.hasTuan || cell.hasTriet) && <span className="mt-auto pt-1 text-[0.65rem] font-medium text-[#a6a7ac]">{[cell.hasTuan && 'Tuần', cell.hasTriet && 'Triệt'].filter(Boolean).join(' · ')}</span>}
    </button>
  );
}

function ChartSummaryCell({ chart }: { chart: TuViChartDto }) {
  return (
    <div className="flex h-full flex-col items-center justify-center rounded-md border border-[#d5ad62]/25 bg-[radial-gradient(circle_at_center,rgba(213,173,98,0.09),transparent_65%),#101827] p-4 text-center">
      <span className="mb-3 h-px w-16 bg-gradient-to-r from-transparent via-[#d5ad62]/70 to-transparent" />
      <p className="font-display text-body-lg font-semibold text-[#e6c980]">Lá số Tử Vi</p>
      <p className="mt-1 text-body-sm text-[#d8d1c2]">{chart.canChi.year.stem} {chart.canChi.year.branch} · {chart.sex}</p>
      <p className="mt-1 text-caption font-semibold text-[#f2eee5]">{chart.cuc}</p>
      <p className="mt-2 text-caption text-[#a6a7ac]">Giờ {chart.hourBranch} · {chart.lunarDate.lunarDay}/{chart.lunarDate.lunarMonth}{chart.lunarDate.isLeapMonth ? ' nhuận' : ''}/{chart.lunarDate.lunarYear} âm lịch</p>
    </div>
  );
}

function PalaceDetail({ cell }: { cell: PalaceCell }) {
  return (
    <section aria-live="polite" aria-labelledby="selected-palace-heading" className="rounded-[16px] border border-[#d5ad62]/25 bg-[#101827] p-4 tablet:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/[0.07] pb-3">
        <div><p className="text-caption uppercase tracking-[0.14em] text-[#d5ad62]">Cung đang chọn · {cell.branch}</p><h3 id="selected-palace-heading" className="mt-1 font-display text-heading-md font-semibold text-[#f2eee5]">{cell.role}</h3></div>
        <div className="flex gap-1">{cell.isMenh && <span className="rounded-sm bg-[#d5ad62]/15 px-2 py-1 text-caption font-semibold text-[#e6c980]">Mệnh</span>}{cell.isThan && <span className="rounded-sm bg-[#708c79]/15 px-2 py-1 text-caption font-semibold text-[#9eb5a5]">Thân</span>}</div>
      </div>
      <div className="mt-4 grid gap-5 tablet:grid-cols-2">
        <div><p className="text-caption font-semibold uppercase tracking-[0.12em] text-[#777b83]">Chính tinh</p>{cell.mainStars.length ? <ul className="mt-2 space-y-2">{cell.mainStars.map(({ star, dignity }) => <li key={star} className="flex flex-wrap items-center gap-2 text-body-md font-semibold text-[#f2eee5]">{star}<span className={`rounded-sm px-1.5 py-0.5 text-caption ${DIGNITY_TONE[dignity]}`}>{DIGNITY_SHORT_LABEL[dignity]}</span>{starTags(star, cell).map((tag) => <sup key={tag} className="text-[#e6c980]">{tag}</sup>)}</li>)}</ul> : <p className="mt-2 text-body-sm text-[#a6a7ac]">Cung này không có chính tinh.</p>}</div>
        <div><p className="text-caption font-semibold uppercase tracking-[0.12em] text-[#777b83]">Phụ tinh và dấu hiệu</p>{cell.auxiliaryStars.length ? <p className="mt-2 text-body-sm leading-relaxed text-[#d8d1c2]">{cell.auxiliaryStars.join(' · ')}</p> : <p className="mt-2 text-body-sm text-[#a6a7ac]">Không có phụ tinh.</p>}<p className="mt-2 text-caption text-[#a6a7ac]">{[cell.hasTuan && 'Tuần', cell.hasTriet && 'Triệt'].filter(Boolean).join(' · ') || 'Không có Tuần / Triệt tại cung này'}</p></div>
      </div>
    </section>
  );
}

export function TuViPalaceGrid({ chart }: { chart: TuViChartDto }) {
  const cells = buildPalaceCells(chart);
  const [selectedBranch, setSelectedBranch] = useState<EarthlyBranchValue>(chart.palaces.menh);
  const selected = cells.find((cell) => cell.branch === selectedBranch) ?? cells[0]!;

  return (
    <div className="space-y-4">
      <div className="hidden aspect-square grid-cols-4 grid-rows-4 gap-1.5 tablet:grid" aria-label="12 palaces, traditional lá số grid layout">
        {cells.map((cell) => { const pos = PALACE_GRID_POSITION[cell.branch]; return <div key={cell.branch} style={{ gridRow: pos.row, gridColumn: pos.col }}><PalaceButton cell={cell} selected={cell.branch === selectedBranch} onSelect={() => setSelectedBranch(cell.branch)} /></div>; })}
        <div style={{ gridRow: '2 / span 2', gridColumn: '2 / span 2' }}><ChartSummaryCell chart={chart} /></div>
      </div>

      <div className="tablet:hidden">
        <div className="mb-3 rounded-md border border-[#d5ad62]/20 bg-[#101827] p-3 text-center"><p className="font-display text-body-md font-semibold text-[#e6c980]">{chart.cuc}</p><p className="mt-1 text-caption text-[#a6a7ac]">Mệnh tại {chart.palaces.menh} · Thân tại {chart.palaces.than} · Giờ {chart.hourBranch}</p></div>
        <div className="grid grid-cols-3 gap-1.5" aria-label="12 palaces, mobile overview">
          {cells.map((cell) => <PalaceButton key={cell.branch} cell={cell} compact selected={cell.branch === selectedBranch} onSelect={() => setSelectedBranch(cell.branch)} />)}
        </div>
      </div>

      <PalaceDetail cell={selected} />
    </div>
  );
}
