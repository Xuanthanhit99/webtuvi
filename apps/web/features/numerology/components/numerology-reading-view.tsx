'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { NumerologyReadingDto } from '@beaconvie/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AiInterpretation } from '@/components/ui/ai-interpretation';
import { toast } from '@/components/ui/toast';
import { trackEvent } from '@/lib/analytics';
import { numerologyApi } from '../api/numerology-api';
import { NumerologyValueCard } from './numerology-value-card';
import { READING_STATUS_BADGE_VARIANT, READING_STATUS_LABELS, VALUE_TYPE_ORDER } from '../labels';
import { Board04NumberMark } from './board04-number-mark';

export function NumerologyReadingView({ reading, onChanged }: { reading: NumerologyReadingDto; onChanged?: () => void }) {
  const queryClient = useQueryClient();
  const { data: meanings } = useQuery({ queryKey: ['numerology', 'meanings'], queryFn: numerologyApi.listMeanings, staleTime: Infinity });
  const meaningFor = (type: string, value: number) => meanings?.find((m) => m.type === type && m.value === value);
  const invalidate = () => { queryClient.invalidateQueries({ queryKey: ['numerology'] }); onChanged?.(); };
  const retryInterpretation = useMutation({ mutationFn: () => numerologyApi.retryInterpretation(reading.id), onSuccess: invalidate, onError: () => toast.error('Chưa thể tạo phần luận giải. Vui lòng thử lại.') });
  const archive = useMutation({ mutationFn: () => numerologyApi.archiveReading(reading.id), onSuccess: () => { invalidate(); toast.success('Đã lưu trữ hồ sơ.'); }, onError: () => toast.error('Chưa thể lưu trữ hồ sơ này.') });
  const restore = useMutation({ mutationFn: () => numerologyApi.restoreReading(reading.id), onSuccess: () => { invalidate(); toast.success('Đã khôi phục hồ sơ.'); }, onError: () => toast.error('Chưa thể khôi phục hồ sơ này.') });
  const remove = useMutation({ mutationFn: () => numerologyApi.deleteReading(reading.id), onSuccess: () => { invalidate(); toast.success('Đã xóa hồ sơ.'); }, onError: () => toast.error('Chưa thể xóa hồ sơ này.') });
  const orderedValues = [...reading.values].sort((a, b) => VALUE_TYPE_ORDER.indexOf(a.type) - VALUE_TYPE_ORDER.indexOf(b.type));
  const lifePath = orderedValues.find((entry) => entry.type === 'LIFE_PATH');
  const secondary = orderedValues.filter((entry) => entry.type !== 'LIFE_PATH');
  const primaryMeaning = lifePath ? meaningFor(lifePath.type, lifePath.value) : undefined;

  return (
    <div className="flex flex-col gap-7">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#b78ad0]/15 pb-4">
        <div><div className="flex items-center gap-2"><Badge variant={READING_STATUS_BADGE_VARIANT[reading.status]}>{READING_STATUS_LABELS[reading.status]}</Badge><span className="text-caption uppercase tracking-[0.16em] text-[#c39cdb]">Hồ sơ số học</span></div><p className="mt-2 text-body-sm text-text-secondary"><span className="font-medium text-text-primary">{reading.normalizedBirthName}</span> · {reading.birthDate}</p></div>
        <div className="flex flex-wrap gap-2">{reading.status === 'ACTIVE' && <Button variant="ghost" size="sm" onClick={() => archive.mutate()} loading={archive.isPending}>Lưu trữ</Button>}{reading.status !== 'ACTIVE' && <Button variant="secondary" size="sm" onClick={() => restore.mutate()} loading={restore.isPending}>Khôi phục</Button>}{reading.status !== 'DELETED' && <Button variant="ghost" size="sm" onClick={() => remove.mutate()} loading={remove.isPending}>Xóa</Button>}</div>
      </header>

      {lifePath && <section aria-labelledby="core-number-title" className="relative isolate overflow-hidden rounded-xl border border-[#b78ad0]/20 bg-[#090c1c] p-5 tablet:p-8">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_76%_45%,rgba(124,73,163,0.24),transparent_34%),linear-gradient(130deg,rgba(8,13,29,0.96),rgba(23,12,35,0.86))]" />
        <div className="grid items-center gap-4 tablet:grid-cols-[minmax(0,1fr)_17rem]">
          <div><p className="text-caption font-semibold uppercase tracking-[0.22em] text-[#c39cdb]">Con số trung tâm</p><h2 id="core-number-title" className="mt-2 font-serif text-heading-lg text-text-primary">Số chủ đạo của bạn</h2>{primaryMeaning && <div className="mt-4 max-w-xl"><p className="font-serif text-heading-sm text-[#f1d69d]">{primaryMeaning.title}</p><p className="mt-2 text-body-md leading-relaxed text-text-secondary">{primaryMeaning.meaning}</p></div>}{lifePath.isMasterNumber && <Badge variant="insight" className="mt-4">Số đặc biệt · giữ nguyên {lifePath.value}</Badge>}</div>
          <Board04NumberMark value={String(lifePath.value)} compact />
        </div>
      </section>}

      {secondary.length > 0 && <section aria-labelledby="number-profile-title"><div className="mb-4"><p className="text-caption font-semibold uppercase tracking-[0.18em] text-[#c39cdb]">Chân dung của bạn</p><h2 id="number-profile-title" className="mt-1 font-serif text-heading-md text-text-primary">Các chỉ số bổ trợ</h2></div><div className="grid gap-3 tablet:grid-cols-2 desktop:grid-cols-3">{secondary.map((entry) => <NumerologyValueCard key={entry.type} entry={entry} meaning={meaningFor(entry.type, entry.value)} />)}</div></section>}

      {lifePath && <section aria-labelledby="core-calculation-title"><h2 id="core-calculation-title" className="mb-4 font-serif text-heading-md text-text-primary">Hiểu số chủ đạo {lifePath.value}</h2><NumerologyValueCard entry={lifePath} meaning={undefined} /></section>}

      <section aria-labelledby="interpretation-title" className="rounded-xl border border-[#b78ad0]/15 bg-[#0a0e1c] p-4 tablet:p-6"><p className="text-caption font-semibold uppercase tracking-[0.18em] text-[#c39cdb]">Góc nhìn cá nhân hóa</p><h2 id="interpretation-title" className="mb-4 mt-1 font-serif text-heading-md text-text-primary">Luận giải dành cho bạn</h2><AiInterpretation interpretation={reading.interpretation} isGenerating={retryInterpretation.isPending} onGenerate={() => { trackEvent('numerology_interpretation_requested', { feature: 'numerology' }); retryInterpretation.mutate(); }} labels={{ heading: 'Luận giải bằng AI', generating: 'Đang viết phần luận giải…', empty: 'Phần luận giải chưa sẵn sàng.', action: 'Tạo luận giải', disclosure: 'AI chỉ diễn giải các kết quả đã tính ở trên, không lựa chọn hay thay đổi bất kỳ con số nào.' }} /></section>
    </div>
  );
}
