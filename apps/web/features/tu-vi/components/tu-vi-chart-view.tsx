'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { TuViChartDto } from '@beaconvie/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AiInterpretation } from '@/components/ui/ai-interpretation';
import { toast } from '@/components/ui/toast';
import { tuViApi } from '../api/tu-vi-api';
import { CHART_STATUS_BADGE_VARIANT, CHART_STATUS_LABELS, PALACE_ROLE_LABELS_EN, TRANSFORMATION_LABELS_EN } from '../labels';
import { TuViPalaceGrid } from './tu-vi-palace-grid';
import { TuViTrustSection } from './tu-vi-trust-section';
import { TuViDaiVanTimeline } from './tu-vi-dai-van-timeline';
import { TuViTieuHanYearNav } from './tu-vi-tieu-han-year-nav';

function Section({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  const sectionId = `tu-vi-section-${title.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <section aria-labelledby={`${sectionId}-heading`} className="rounded-lg border border-[rgba(213,173,98,0.16)] bg-surface px-4">
      <button
        type="button"
        id={`${sectionId}-heading`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={sectionId}
        className="flex w-full items-center justify-between gap-2 py-3 text-left text-body-sm font-semibold text-text-primary"
      >
        {title}
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform duration-fast ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {open && (
        <div id={sectionId} className="pb-4">
          {children}
        </div>
      )}
    </section>
  );
}

/**
 * Sprint 18B.11 — a chart's full experience: deterministic facts (lá số grid, Mệnh/Thân/Cục,
 * Tứ Hóa, Tuần/Triệt — clearly labeled "Deterministic — never AI-generated", matching this
 * product's established fact-vs-AI separation discipline) above the AI interpretation, and
 * lifecycle actions. Every value rendered here is the real, already-persisted result the
 * deterministic engine (18B.1–18B.8) computed — nothing is invented client-side.
 */
export function TuViChartView({ chart, onChanged }: { chart: TuViChartDto; onChanged?: () => void }) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['tu-vi'] });
    onChanged?.();
  };

  const retryInterpretation = useMutation({
    mutationFn: () => tuViApi.retryInterpretation(chart.id),
    onSuccess: invalidate,
    onError: () => toast.error('Chưa thể tạo phần luận giải. Vui lòng thử lại.'),
  });
  const archive = useMutation({
    mutationFn: () => tuViApi.archiveChart(chart.id),
    onSuccess: () => {
      invalidate();
      toast.success('Đã lưu lá số vào kho lưu trữ.');
    },
    onError: () => toast.error('Chưa thể lưu trữ lá số này.'),
  });
  const restore = useMutation({
    mutationFn: () => tuViApi.restoreChart(chart.id),
    onSuccess: () => {
      invalidate();
      toast.success('Đã khôi phục lá số.');
    },
    onError: () => toast.error('Chưa thể khôi phục lá số này.'),
  });
  const remove = useMutation({
    mutationFn: () => tuViApi.deleteChart(chart.id),
    onSuccess: () => {
      invalidate();
      toast.success('Đã xóa lá số.');
    },
    onError: () => toast.error('Chưa thể xóa lá số này.'),
  });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={CHART_STATUS_BADGE_VARIANT[chart.status]}>{CHART_STATUS_LABELS[chart.status]}</Badge>
          <span className="text-caption text-text-secondary">
            Sinh ngày {chart.birthDate}, lúc {chart.birthTime} · <span className="text-text-primary">{chart.sex}</span>
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {chart.status === 'ACTIVE' && (
            <Button variant="ghost" size="sm" onClick={() => archive.mutate()} loading={archive.isPending}>
              Lưu trữ
            </Button>
          )}
          {chart.status !== 'ACTIVE' && (
            <Button variant="secondary" size="sm" onClick={() => restore.mutate()} loading={restore.isPending}>
              Khôi phục
            </Button>
          )}
          {chart.status !== 'DELETED' && (
            <Button variant="ghost" size="sm" onClick={() => remove.mutate()} loading={remove.isPending}>
              Xóa
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[#708c79]/20 bg-[#708c79]/[0.05] px-4 py-3">
        <p className="text-caption text-text-secondary">Cung, sao và chu kỳ được tính từ dữ liệu sinh bằng hệ quy tắc cố định.</p>
        <Badge variant="new">Dữ liệu lá số · Không do AI tạo</Badge>
      </div>

      <TuViTrustSection context="kết quả" />

      <div className="rounded-[20px] border border-[#d5ad62]/20 bg-[#080e18] p-3 shadow-[0_24px_70px_rgba(0,0,0,0.26)] tablet:p-5">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2 border-b border-white/[0.07] pb-4">
          <div><p className="text-caption font-semibold uppercase tracking-[0.16em] text-[#d5ad62]">Bản đồ 12 cung</p><h2 className="mt-1 font-display text-heading-md font-semibold text-[#f2eee5]">Lá số của bạn</h2></div>
          <p className="text-caption text-[#a6a7ac]">Chọn một cung để xem chi tiết</p>
        </div>
        <TuViPalaceGrid chart={chart} />
      </div>

      <div className="rounded-lg border border-[rgba(213,173,98,0.2)] bg-surface p-4 tablet:p-5">
          <p className="font-display text-body-sm font-semibold uppercase tracking-[0.16em] text-insight">Tổng quan lá số</p>
          <div className="mt-3 grid grid-cols-2 gap-4 tablet:grid-cols-4">
            <div>
              <p className="text-caption text-text-tertiary">Mệnh</p>
              <p className="font-display text-heading-md font-semibold text-text-primary">{chart.palaces.menh}</p>
            </div>
            <div>
              <p className="text-caption text-text-tertiary">Thân</p>
              <p className="font-display text-heading-md font-semibold text-text-primary">{chart.palaces.than}</p>
            </div>
          </div>
          <div className="border-t border-[rgba(213,173,98,0.14)] pt-3 tablet:border-l tablet:border-t-0 tablet:pl-4 tablet:pt-0">
            <p className="text-caption text-text-tertiary">Cục</p>
            <p className="text-body-md font-semibold text-text-primary">{chart.cuc}</p>
          </div>
          <dl className="grid grid-cols-2 gap-2 border-t border-[rgba(213,173,98,0.14)] pt-3 text-body-sm tablet:border-l tablet:border-t-0 tablet:pl-4 tablet:pt-0">
            <dt className="text-text-secondary">Can Chi năm</dt>
            <dd className="text-text-primary">
              {chart.canChi.year.stem} {chart.canChi.year.branch}
            </dd>
            <dt className="text-text-secondary">Giờ sinh</dt>
            <dd className="text-text-primary">{chart.hourBranch}</dd>
          </dl>
      </div>

      <TuViDaiVanTimeline chart={chart} />
      <TuViTieuHanYearNav chart={chart} />

      <Section title="Tứ Hóa">
        <ul className="flex flex-col gap-1.5 text-body-sm">
          {chart.transformations.map((t) => (
            <li key={t.transformation} className="flex items-center justify-between gap-2">
              <span className="text-text-primary">
                {t.transformation} <span className="sr-only">({TRANSFORMATION_LABELS_EN[t.transformation] ?? t.transformation})</span>
              </span>
              <span className="text-text-secondary">
                {t.targetStar} · {t.position}
              </span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Tuần / Triệt">
        <dl className="grid grid-cols-2 gap-2 text-body-sm">
          <dt className="text-text-secondary">Tuần</dt>
          <dd className="text-text-primary">
            {chart.tuan.first}, {chart.tuan.second}
          </dd>
          <dt className="text-text-secondary">Triệt</dt>
          <dd className="text-text-primary">
            {chart.triet.first}, {chart.triet.second}
          </dd>
        </dl>
      </Section>

      <AiInterpretation
        interpretation={chart.interpretation}
        isGenerating={retryInterpretation.isPending}
        onGenerate={() => retryInterpretation.mutate()}
        labels={{
          heading: 'Luận giải bằng AI',
          generating: 'Đang viết phần luận giải…',
          empty: 'Phần luận giải chưa sẵn sàng.',
          action: 'Tạo luận giải',
          disclosure: 'AI chỉ diễn giải dữ liệu phía trên — không lựa chọn hoặc thay đổi cung, sao hay chu kỳ.',
        }}
      />

      <Section title="Thông tin hệ thống tính toán">
        <dl className="grid grid-cols-2 gap-2 text-body-sm">
          <dt className="text-text-secondary">Phiên bản engine</dt>
          <dd className="text-text-primary">{chart.versions.engineVersion}</dd>
          <dt className="text-text-secondary">Bộ quy tắc</dt>
          <dd className="text-text-primary">{chart.versions.rulesetVersion}</dd>
          <dt className="text-text-secondary">Hệ chính tinh</dt>
          <dd className="text-text-primary">{chart.versions.mainStarVersion}</dd>
          <dt className="text-text-secondary">Hệ phụ tinh</dt>
          <dd className="text-text-primary">{chart.versions.auxiliaryVersion}</dd>
        </dl>
      </Section>

      <Section title="Danh mục 12 cung">
        <ul className="grid grid-cols-1 gap-1 text-body-sm tablet:grid-cols-2">
          {Object.entries(PALACE_ROLE_LABELS_EN).map(([role, en]) => (
            <li key={role} className="text-text-secondary">
              <span className="text-text-primary">{role}</span> — {en}
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
