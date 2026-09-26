'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { NumerologyReadingDto } from '@beaconvie/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { ApiError } from '@/lib/api-error';
import { trackEvent } from '@/lib/analytics';
import { clearGuestNumerologyTrial, readGuestNumerologyTrial } from '@/features/guest-trials/guest-trial-storage';
import { numerologyApi } from '../api/numerology-api';
import { NumerologyReadingView } from './numerology-reading-view';

const NAME_MAX_LENGTH = 200;
function fieldErrorFor(error: ApiError): { field: 'fullBirthName' | 'birthDate' | null; message: string } {
  switch (error.code) {
    case 'NUMEROLOGY_NAME_EMPTY': return { field: 'fullBirthName', message: 'Vui lòng nhập đầy đủ họ tên khai sinh.' };
    case 'NUMEROLOGY_NAME_TRANSLITERATION_UNSUPPORTED': return { field: 'fullBirthName', message: 'Tên cần có ít nhất một ký tự Latin để có thể tính toán.' };
    case 'NUMEROLOGY_INVALID_DATE_FORMAT':
    case 'NUMEROLOGY_INVALID_CALENDAR_DATE': return { field: 'birthDate', message: 'Ngày sinh chưa hợp lệ.' };
    case 'NUMEROLOGY_FUTURE_DATE_NOT_ALLOWED': return { field: 'birthDate', message: 'Ngày sinh không thể ở tương lai.' };
    case 'NUMEROLOGY_DATE_TOO_OLD': return { field: 'birthDate', message: 'Ngày sinh nằm ngoài phạm vi được hỗ trợ.' };
    default: return { field: null, message: 'Chưa thể tính các chỉ số. Vui lòng thử lại.' };
  }
}

export function NumerologyForm({ onCalculated }: { onCalculated?: (reading: NumerologyReadingDto) => void }) {
  const queryClient = useQueryClient();
  const [fullBirthName, setFullBirthName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [phase, setPhase] = useState<'idle' | 'calculating' | 'revealed'>('idle');
  const [result, setResult] = useState<NumerologyReadingDto | null>(null);
  const [fieldError, setFieldError] = useState<{ field: 'fullBirthName' | 'birthDate' | null; message: string } | null>(null);
  const [limitBanner, setLimitBanner] = useState<{ message: string; showUpgrade: boolean } | null>(null);

  useEffect(() => {
    const saved = readGuestNumerologyTrial();
    if (!saved) return;
    const task = window.setTimeout(() => setBirthDate(saved.birthDate), 0);
    return () => window.clearTimeout(task);
  }, []);
  const calculate = useMutation({
    mutationFn: () => numerologyApi.calculate(fullBirthName.trim(), birthDate),
    onSuccess: (reading) => {
      setResult(reading); setPhase('revealed'); clearGuestNumerologyTrial();
      queryClient.invalidateQueries({ queryKey: ['numerology'] }); onCalculated?.(reading);
    },
    onError: (error: unknown) => {
      setPhase('idle');
      if (error instanceof ApiError) {
        if (error.code === 'PREMIUM_REQUIRED') { setLimitBanner({ message: 'Bạn đã dùng hết lượt miễn phí. Nâng cấp Premium để tiếp tục.', showUpgrade: true }); return; }
        if (error.code === 'NUMEROLOGY_DAILY_LIMIT_REACHED') { setLimitBanner({ message: 'Bạn đã đạt giới hạn tính Thần số học hôm nay. Vui lòng quay lại sau.', showUpgrade: false }); return; }
        setFieldError(fieldErrorFor(error)); return;
      }
      setFieldError({ field: null, message: 'Chưa thể tính các chỉ số. Vui lòng thử lại.' });
    },
  });

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault(); setFieldError(null); setLimitBanner(null);
    if (!fullBirthName.trim()) { setFieldError({ field: 'fullBirthName', message: 'Vui lòng nhập đầy đủ họ tên khai sinh.' }); return; }
    if (fullBirthName.trim().length > NAME_MAX_LENGTH) { setFieldError({ field: 'fullBirthName', message: `Họ tên không được dài quá ${NAME_MAX_LENGTH} ký tự.` }); return; }
    if (!birthDate) { setFieldError({ field: 'birthDate', message: 'Vui lòng chọn ngày sinh.' }); return; }
    setPhase('calculating'); trackEvent('numerology_started', { feature: 'numerology' }); calculate.mutate();
  }

  if (phase === 'revealed' && result) {
    return <div className="flex flex-col gap-4"><NumerologyReadingView reading={result} onChanged={async () => setResult(await numerologyApi.getReading(result.id))} />
      <Button variant="ghost" size="sm" onClick={() => { setPhase('idle'); setResult(null); setFullBirthName(''); setBirthDate(''); clearGuestNumerologyTrial(); }}>Tạo hồ sơ khác</Button>
    </div>;
  }

  return (
    <form onSubmit={handleSubmit} className="relative grid overflow-hidden rounded-xl border border-[#b78ad0]/20 bg-[#080d1c] tablet:grid-cols-[minmax(0,1.15fr)_minmax(17rem,0.85fr)]" noValidate>
      <div className="flex flex-col gap-5 p-5 tablet:p-7">
        <div><p className="font-serif text-heading-sm text-text-primary">Thông tin của bạn</p><p className="mt-1 text-body-sm text-text-secondary">Nhập đúng họ tên trên giấy khai sinh để các chỉ số từ tên được nhất quán.</p></div>
        <FormField label="Họ tên khai sinh" htmlFor="numerology-name" required error={fieldError?.field === 'fullBirthName' ? fieldError.message : undefined}>
          <Input id="numerology-name" value={fullBirthName} onChange={(e) => setFullBirthName(e.target.value)} placeholder="Ví dụ: Nguyễn Văn An" maxLength={NAME_MAX_LENGTH} invalid={fieldError?.field === 'fullBirthName'} autoComplete="name" />
        </FormField>
        <FormField label="Ngày sinh" htmlFor="numerology-birthdate" required error={fieldError?.field === 'birthDate' ? fieldError.message : undefined}>
          <Input id="numerology-birthdate" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} max={new Date().toISOString().slice(0, 10)} invalid={fieldError?.field === 'birthDate'} />
        </FormField>
        {fieldError?.field === null && <p role="alert" className="text-body-sm text-caution">{fieldError.message}</p>}
        {limitBanner && <div role="alert" className="flex flex-col gap-2 rounded-md border border-insight/30 bg-insight/5 px-4 py-3 text-body-sm text-text-primary"><span>{limitBanner.message}</span>{limitBanner.showUpgrade && <Link href="/premium?reason=required" className="self-start"><Button variant="secondary" size="sm">Nâng cấp Premium</Button></Link>}</div>}
        <Button type="submit" variant="primary" loading={phase === 'calculating'}>{phase === 'calculating' ? 'Đang tính các chỉ số…' : 'Khám phá hồ sơ số học'}</Button>
      </div>
      <aside className="relative border-t border-[#b78ad0]/15 bg-[radial-gradient(circle_at_70%_20%,rgba(143,89,179,0.18),transparent_42%),rgba(17,12,31,0.72)] p-5 text-body-sm text-text-secondary tablet:border-l tablet:border-t-0 tablet:p-7">
        <p className="text-caption font-semibold uppercase tracking-[0.2em] text-[#c39cdb]">Bạn sẽ nhận được</p><p className="mt-3 font-serif text-heading-sm text-[#f1d69d]">Một chân dung số học có chiều sâu</p>
        <ul className="mt-5 space-y-4"><li><span className="text-text-primary">Bản sắc cốt lõi</span><br />Đường đời, sứ mệnh, linh hồn và nhân cách.</li><li><span className="text-text-primary">Nhịp điệu hiện tại</span><br />Ngày sinh và năm cá nhân của bạn.</li><li><span className="text-text-primary">Minh bạch</span><br />Có thể mở từng chỉ số để xem cách hình thành.</li></ul>
        <p className="mt-6 border-t border-[#b78ad0]/15 pt-4 text-caption">Họ tên và ngày sinh chỉ được dùng để tạo hồ sơ số học của bạn.</p>
      </aside>
    </form>
  );
}
