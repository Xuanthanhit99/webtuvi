'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { EasternHoroscopeProfileDto } from '@beaconvie/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { ApiError } from '@/lib/api-error';
import { trackEvent } from '@/lib/analytics';
import { easternHoroscopeApi } from '../api/eastern-horoscope-api';
import { EasternHoroscopeProfileView } from './eastern-horoscope-profile-view';

function fieldErrorFor(error: ApiError): { message: string } {
  switch (error.code) {
    case 'EASTERN_HOROSCOPE_INVALID_DATE_FORMAT': return { message: 'Ngày sinh chưa đúng định dạng.' };
    case 'EASTERN_HOROSCOPE_INVALID_DATE': return { message: 'Ngày sinh không hợp lệ.' };
    case 'EASTERN_HOROSCOPE_DATE_OUT_OF_RANGE': return { message: 'Ngày sinh nằm ngoài phạm vi hệ thống hỗ trợ.' };
    case 'EASTERN_HOROSCOPE_FUTURE_DATE': return { message: 'Ngày sinh không thể ở tương lai.' };
    default:
      return { message: 'Chưa thể tính bản mệnh lúc này. Vui lòng thử lại.' };
  }
}

/** Birth date only — this module needs no birth time, location, or gender (Bible Module 14 §14;
 * docs/domain/eastern-horoscope-rules.md §6). Calculate -> canonical result reveal -> optional
 * interpretation, mirroring NumerologyForm's own pacing precedent. */
export function EasternHoroscopeForm({ onCalculated }: { onCalculated?: (profile: EasternHoroscopeProfileDto) => void }) {
  const queryClient = useQueryClient();
  const [birthDate, setBirthDate] = useState('');
  const [phase, setPhase] = useState<'idle' | 'calculating' | 'revealed'>('idle');
  const [result, setResult] = useState<EasternHoroscopeProfileDto | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [limitBanner, setLimitBanner] = useState<{ message: string; showUpgrade: boolean } | null>(null);

  const calculate = useMutation({
    mutationFn: () => easternHoroscopeApi.calculate(birthDate),
    onSuccess: (profile) => {
      setResult(profile);
      setPhase('revealed');
      queryClient.invalidateQueries({ queryKey: ['eastern-horoscope'] });
      onCalculated?.(profile);
    },
    onError: (error: unknown) => {
      setPhase('idle');
      if (error instanceof ApiError) {
        if (error.code === 'PREMIUM_REQUIRED') {
          setLimitBanner({ message: 'Bạn đã dùng hết lượt miễn phí. Nâng cấp Premium để tiếp tục.', showUpgrade: true });
          return;
        }
        if (error.code === 'EASTERN_HOROSCOPE_DAILY_LIMIT_REACHED') {
          setLimitBanner({ message: 'Bạn đã đạt giới hạn tính hôm nay. Vui lòng quay lại sau.', showUpgrade: false });
          return;
        }
        setFieldError(fieldErrorFor(error).message);
        return;
      }
      setFieldError('Chưa thể tính bản mệnh lúc này. Vui lòng thử lại.');
    },
  });

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFieldError(null);
    setLimitBanner(null);

    if (!birthDate) {
      setFieldError('Vui lòng chọn ngày sinh.');
      return;
    }

    setPhase('calculating');
    trackEvent('eastern_horoscope_started', { feature: 'eastern_horoscope' });
    calculate.mutate();
  }

  if (phase === 'revealed' && result) {
    return (
      <div className="flex flex-col gap-4">
        <EasternHoroscopeProfileView
          profile={result}
          onChanged={async () => {
            const fresh = await easternHoroscopeApi.getProfile(result.id);
            setResult(fresh);
          }}
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setPhase('idle');
            setResult(null);
            setBirthDate('');
          }}
        >
          Xem ngày sinh khác
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-md border border-border-subtle bg-surface p-4" noValidate>
      <FormField label="Ngày sinh" htmlFor="eastern-horoscope-birthdate" required error={fieldError ?? undefined}>
        <Input
          id="eastern-horoscope-birthdate"
          type="date"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
          max={new Date().toISOString().slice(0, 10)}
          invalid={!!fieldError}
        />
      </FormField>
      <p className="text-body-xs text-text-tertiary">
        Nếu ngày sinh ở gần Tết Nguyên đán, năm con giáp có thể thuộc năm âm lịch trước thay vì trùng với năm dương lịch. Mệnh Vi xử lý trường hợp này theo lịch âm dương.
      </p>

      {limitBanner && (
        <div role="alert" className="flex flex-col gap-2 rounded-md border border-insight/30 bg-insight/5 px-4 py-3 text-body-sm text-text-primary">
          <span>{limitBanner.message}</span>
          {limitBanner.showUpgrade && (
            <Link href="/premium?reason=required" className="self-start">
              <Button variant="secondary" size="sm">
                Nâng cấp Premium
              </Button>
            </Link>
          )}
        </div>
      )}

      <Button type="submit" variant="primary" loading={phase === 'calculating'}>
        {phase === 'calculating' ? 'Đang tính…' : 'Khám phá bản mệnh'}
      </Button>
    </form>
  );
}
