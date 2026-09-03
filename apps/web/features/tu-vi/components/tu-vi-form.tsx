'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CalendarDays, Clock3, Orbit, ShieldCheck, UserRound } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { TuViChartDto } from '@beaconvie/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { ApiError } from '@/lib/api-error';
import { trackEvent } from '@/lib/analytics';
import { tuViApi } from '../api/tu-vi-api';
import { TuViChartView } from './tu-vi-chart-view';

type FieldName = 'birthDate' | 'birthTime' | null;

const ERROR_MESSAGES: Record<string, string> = {
  TUVI_INVALID_DATE_FORMAT: 'Ngày sinh phải đúng định dạng ngày, tháng và năm.',
  TUVI_INVALID_DATE: 'Ngày sinh này không tồn tại trong dương lịch.',
  TUVI_DATE_OUT_OF_RANGE: 'Ngày sinh nằm ngoài khoảng thời gian hệ thống hỗ trợ.',
  TUVI_DATE_IN_FUTURE: 'Ngày sinh không thể ở trong tương lai.',
  TUVI_INVALID_TIME_FORMAT: 'Giờ sinh phải theo định dạng 24 giờ.',
  TUVI_INVALID_TIME: 'Vui lòng nhập một giờ sinh hợp lệ từ 00:00 đến 23:59.',
};

function fieldErrorFor(error: ApiError): { field: FieldName; message: string } {
  const message = ERROR_MESSAGES[error.code] ?? error.message;
  if (['TUVI_INVALID_DATE_FORMAT', 'TUVI_INVALID_DATE', 'TUVI_DATE_OUT_OF_RANGE', 'TUVI_DATE_IN_FUTURE'].includes(error.code)) return { field: 'birthDate', message };
  if (['TUVI_INVALID_TIME_FORMAT', 'TUVI_INVALID_TIME'].includes(error.code)) return { field: 'birthTime', message };
  return { field: null, message };
}

export function TuViForm({ onCalculated }: { onCalculated?: (chart: TuViChartDto) => void }) {
  const queryClient = useQueryClient();
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [sex, setSex] = useState<'Nam' | 'Nữ' | ''>('');
  const [result, setResult] = useState<TuViChartDto | null>(null);
  const [fieldError, setFieldError] = useState<{ field: FieldName; message: string } | null>(null);
  const [sexError, setSexError] = useState<string | null>(null);
  const [limitBanner, setLimitBanner] = useState<{ message: string; showUpgrade: boolean } | null>(null);

  const calculate = useMutation({
    mutationFn: () => tuViApi.calculate({ birthDate, birthTime, sex: sex as 'Nam' | 'Nữ' }),
    onSuccess: (chart) => {
      setResult(chart);
      queryClient.invalidateQueries({ queryKey: ['tu-vi'] });
      onCalculated?.(chart);
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError) {
        if (error.code === 'PREMIUM_REQUIRED' || error.code === 'TU_VI_DAILY_LIMIT_REACHED') {
          setLimitBanner({ message: error.message, showUpgrade: error.code === 'PREMIUM_REQUIRED' });
          return;
        }
        setFieldError(fieldErrorFor(error));
        return;
      }
      setFieldError({ field: null, message: 'Chưa thể lập lá số lúc này. Vui lòng thử lại.' });
    },
  });

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFieldError(null);
    setSexError(null);
    setLimitBanner(null);
    if (!birthDate) return setFieldError({ field: 'birthDate', message: 'Vui lòng chọn ngày sinh.' });
    if (!birthTime) return setFieldError({ field: 'birthTime', message: 'Giờ sinh là dữ liệu bắt buộc để xác định cung và an sao.' });
    if (!sex) return setSexError('Vui lòng chọn Nam hoặc Nữ theo hệ quy tắc của lá số.');
    trackEvent('tu_vi_started', { feature: 'tu_vi' });
    calculate.mutate();
  }

  if (result) {
    return (
      <div className="flex flex-col gap-5">
        <TuViChartView chart={result} onChanged={async () => setResult(await tuViApi.getChart(result.id))} />
        <Button variant="ghost" size="sm" onClick={() => { setResult(null); setBirthDate(''); setBirthTime(''); setSex(''); }}>
          Lập một lá số khác
        </Button>
      </div>
    );
  }

  if (calculate.isPending) {
    return (
      <div role="status" aria-live="polite" className="relative isolate overflow-hidden rounded-[20px] border border-[#d5ad62]/20 bg-[#0a111d] px-6 py-14 text-center">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(213,173,98,0.12),transparent_42%)]" />
        <div className="relative mx-auto h-24 w-24 motion-reduce:hidden">
          <span className="absolute inset-0 animate-[mv-orbit-spin_8s_linear_infinite] rounded-full border border-[#d5ad62]/35" />
          <span className="absolute inset-3 animate-[mv-orbit-spin-reverse_6s_linear_infinite] rounded-full border border-dashed border-[#708c79]/50" />
          <Orbit className="absolute inset-0 m-auto h-8 w-8 text-[#e6c980]" aria-hidden="true" />
        </div>
        <Orbit className="relative mx-auto hidden h-8 w-8 text-[#e6c980] motion-reduce:block" aria-hidden="true" />
        <p className="relative mt-5 font-display text-heading-md text-[#f2eee5]">Đang lập lá số…</p>
        <p className="relative mx-auto mt-2 max-w-md text-body-sm text-[#a6a7ac]">Hệ thống đang xác định 12 cung, an sao và các chu kỳ từ dữ liệu sinh bạn đã nhập.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="relative overflow-hidden rounded-[20px] border border-[#d5ad62]/20 bg-[#0a111d]" noValidate>
      <div className="grid desktop:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]">
        <div className="space-y-6 p-5 tablet:p-7 desktop:p-9">
          <div>
            <p className="text-caption font-semibold uppercase tracking-[0.18em] text-[#d5ad62]">Dương lịch</p>
            <h3 className="mt-1 font-display text-heading-md font-semibold text-[#f2eee5]">Thông tin sinh của bạn</h3>
            <p className="mt-2 text-body-sm text-[#a6a7ac]">Phiên bản hiện tại nhận ngày dương lịch. Hệ thống sẽ tự chuyển đổi sang âm lịch khi lập lá số.</p>
          </div>

          <div className="grid gap-5 tablet:grid-cols-2">
            <div className="rounded-md border border-white/[0.07] bg-[#0b1220]/75 p-4">
              <div className="mb-3 flex items-center gap-2 text-[#e6c980]"><CalendarDays className="h-4 w-4" aria-hidden="true" /><span className="text-caption font-semibold uppercase tracking-[0.12em]">01 · Ngày sinh</span></div>
              <FormField label="Ngày sinh dương lịch" htmlFor="tu-vi-birthdate" required error={fieldError?.field === 'birthDate' ? fieldError.message : undefined}>
                <Input id="tu-vi-birthdate" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} max={new Date().toISOString().slice(0, 10)} invalid={fieldError?.field === 'birthDate'} />
              </FormField>
            </div>

            <div className="rounded-md border border-white/[0.07] bg-[#0b1220]/75 p-4">
              <div className="mb-3 flex items-center gap-2 text-[#e6c980]"><Clock3 className="h-4 w-4" aria-hidden="true" /><span className="text-caption font-semibold uppercase tracking-[0.12em]">02 · Giờ sinh</span></div>
              <FormField label="Giờ sinh chính xác" htmlFor="tu-vi-birthtime" required hint="Nhập theo giờ 24 giờ. Hệ thống sẽ xác định khung giờ địa chi tương ứng." error={fieldError?.field === 'birthTime' ? fieldError.message : undefined}>
                <Input id="tu-vi-birthtime" type="time" value={birthTime} onChange={(e) => setBirthTime(e.target.value)} invalid={fieldError?.field === 'birthTime'} />
              </FormField>
            </div>
          </div>

          <fieldset className="rounded-md border border-white/[0.07] bg-[#0b1220]/75 p-4">
            <legend className="sr-only">Giới tính</legend>
            <div className="mb-3 flex items-center gap-2 text-[#e6c980]"><UserRound className="h-4 w-4" aria-hidden="true" /><span className="text-caption font-semibold uppercase tracking-[0.12em]">03 · Giới tính <span className="text-caution">*</span></span></div>
            <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-required="true" aria-invalid={!!sexError} aria-describedby={sexError ? 'tu-vi-sex-error' : undefined}>
              {(['Nam', 'Nữ'] as const).map((value) => (
                <label key={value} htmlFor={`tu-vi-sex-${value}`} className={`flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-md border px-3 py-2 text-body-sm font-semibold transition-colors ${sex === value ? 'border-[#d5ad62] bg-[#d5ad62]/10 text-[#f2eee5]' : 'border-white/10 text-[#a6a7ac] hover:border-[#d5ad62]/45'}`}>
                  <input id={`tu-vi-sex-${value}`} type="radio" name="tu-vi-sex" value={value} checked={sex === value} onChange={() => setSex(value)} className="h-4 w-4 accent-[#d5ad62]" />{value}
                </label>
              ))}
            </div>
            {sexError && <p id="tu-vi-sex-error" role="alert" className="mt-2 text-body-sm text-caution">{sexError}</p>}
          </fieldset>

          {fieldError?.field === null && <p role="alert" className="text-body-sm text-caution">{fieldError.message}</p>}
          {limitBanner && <div role="alert" className="rounded-md border border-[#d5ad62]/30 bg-[#d5ad62]/[0.06] p-4 text-body-sm text-[#f2eee5]">{limitBanner.message}{limitBanner.showUpgrade && <Link href="/premium?reason=required" className="mt-3 block font-semibold text-[#e6c980]">Xem gói Premium</Link>}</div>}
          <Button type="submit" variant="primary" className="w-full tablet:w-auto">Lập lá số của tôi</Button>
        </div>

        <aside className="relative border-t border-[#d5ad62]/15 bg-[#0c1522] p-5 tablet:p-7 desktop:border-l desktop:border-t-0 desktop:p-9">
          <div className="absolute right-5 top-5 h-28 w-28 rounded-full border border-[#d5ad62]/10" />
          <p className="relative text-caption font-semibold uppercase tracking-[0.16em] text-[#d5ad62]">Trước khi bắt đầu</p>
          <h3 className="relative mt-2 font-display text-heading-md font-semibold text-[#f2eee5]">Giờ sinh tạo nên khác biệt</h3>
          <p className="relative mt-3 text-body-sm leading-relaxed text-[#a6a7ac]">Tử Vi dùng giờ sinh để xác định cung Mệnh, cung Thân và vị trí nhiều nhóm sao. Nếu chưa chắc chắn, hãy kiểm tra lại giấy khai sinh hoặc hỏi người thân.</p>
          <div className="relative mt-6 space-y-3 border-t border-white/[0.07] pt-5 text-body-sm text-[#d8d1c2]">
            <p className="flex gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#708c79]" aria-hidden="true" />Chỉ ba trường dữ liệu mà engine thực sự cần.</p>
            <p className="flex gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#708c79]" aria-hidden="true" />Không có chế độ “không rõ giờ sinh” vì engine hiện không hỗ trợ.</p>
            <p className="flex gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#708c79]" aria-hidden="true" />Kết quả được lưu vào tài khoản sau khi tính thành công.</p>
          </div>
        </aside>
      </div>
    </form>
  );
}
