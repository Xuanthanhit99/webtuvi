'use client';

import { useState } from 'react';
import Link from 'next/link';
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

/** Maps a real backend error code to a plain-language field error — never a raw code shown to the
 * user (mirrors NatalChart's/EasternHoroscope's own `fieldErrorFor` precedent). */
function fieldErrorFor(error: ApiError): { field: FieldName; message: string } {
  switch (error.code) {
    case 'TUVI_INVALID_DATE_FORMAT':
    case 'TUVI_INVALID_DATE':
    case 'TUVI_DATE_OUT_OF_RANGE':
    case 'TUVI_DATE_IN_FUTURE':
      return { field: 'birthDate', message: error.message };
    case 'TUVI_INVALID_TIME_FORMAT':
    case 'TUVI_INVALID_TIME':
      return { field: 'birthTime', message: error.message };
    default:
      return { field: null, message: error.message };
  }
}

/**
 * Sprint 18B.11 — birth date, birth time, and sex, all required (unlike Eastern Horoscope's
 * date-only form — Tử Vi's calculation genuinely depends on both: the hour branch and CORE_13's
 * sex-dependent Hỏa Tinh/Linh Tinh direction). Calculate -> canonical result reveal, mirroring
 * every other Discovery form's pacing precedent in this product.
 */
export function TuViForm({ onCalculated }: { onCalculated?: (chart: TuViChartDto) => void }) {
  const queryClient = useQueryClient();
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [sex, setSex] = useState<'Nam' | 'Nữ' | ''>('');
  const [phase, setPhase] = useState<'idle' | 'calculating' | 'revealed'>('idle');
  const [result, setResult] = useState<TuViChartDto | null>(null);
  const [fieldError, setFieldError] = useState<{ field: FieldName; message: string } | null>(null);
  const [sexError, setSexError] = useState<string | null>(null);
  const [limitBanner, setLimitBanner] = useState<{ message: string; showUpgrade: boolean } | null>(null);

  const calculate = useMutation({
    mutationFn: () => tuViApi.calculate({ birthDate, birthTime, sex: sex as 'Nam' | 'Nữ' }),
    onSuccess: async (chart) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setResult(chart);
      setPhase('revealed');
      queryClient.invalidateQueries({ queryKey: ['tu-vi'] });
      onCalculated?.(chart);
    },
    onError: (error: unknown) => {
      setPhase('idle');
      if (error instanceof ApiError) {
        if (error.code === 'PREMIUM_REQUIRED') {
          setLimitBanner({ message: error.message, showUpgrade: true });
          return;
        }
        if (error.code === 'TU_VI_DAILY_LIMIT_REACHED') {
          setLimitBanner({ message: error.message, showUpgrade: false });
          return;
        }
        setFieldError(fieldErrorFor(error));
        return;
      }
      setFieldError({ field: null, message: "Couldn't calculate your lá số right now. Please try again." });
    },
  });

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFieldError(null);
    setSexError(null);
    setLimitBanner(null);

    if (!birthDate) {
      setFieldError({ field: 'birthDate', message: 'Birth date is required.' });
      return;
    }
    if (!birthTime) {
      setFieldError({ field: 'birthTime', message: 'Birth time is required — it determines your hour branch.' });
      return;
    }
    if (!sex) {
      setSexError('Please select Nam or Nữ.');
      return;
    }

    setPhase('calculating');
    trackEvent('tu_vi_started', { feature: 'tu_vi' });
    calculate.mutate();
  }

  if (phase === 'revealed' && result) {
    return (
      <div className="flex flex-col gap-4">
        <TuViChartView
          chart={result}
          onChanged={async () => {
            const fresh = await tuViApi.getChart(result.id);
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
            setBirthTime('');
            setSex('');
          }}
        >
          Calculate another lá số
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-md border border-border-subtle bg-surface p-4" noValidate>
      <FormField label="Date of birth" htmlFor="tu-vi-birthdate" required error={fieldError?.field === 'birthDate' ? fieldError.message : undefined}>
        <Input
          id="tu-vi-birthdate"
          type="date"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
          max={new Date().toISOString().slice(0, 10)}
          invalid={fieldError?.field === 'birthDate'}
        />
      </FormField>

      <FormField
        label="Time of birth"
        htmlFor="tu-vi-birthtime"
        required
        hint="Your birth hour sets the hour branch (giờ sinh) — required for an accurate lá số."
        error={fieldError?.field === 'birthTime' ? fieldError.message : undefined}
      >
        <Input id="tu-vi-birthtime" type="time" value={birthTime} onChange={(e) => setBirthTime(e.target.value)} invalid={fieldError?.field === 'birthTime'} />
      </FormField>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-body-sm font-medium text-text-primary">
          Sex <span className="text-caution">*</span>
        </legend>
        <div className="flex gap-3" role="radiogroup" aria-required="true" aria-invalid={!!sexError}>
          {(['Nam', 'Nữ'] as const).map((value) => (
            <label
              key={value}
              htmlFor={`tu-vi-sex-${value}`}
              className={`flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border px-3 py-2 text-body-sm transition-colors duration-fast ${
                sex === value ? 'border-insight bg-insight/10 text-text-primary' : 'border-border-subtle bg-surface text-text-secondary hover:border-insight/50'
              }`}
            >
              <input
                id={`tu-vi-sex-${value}`}
                type="radio"
                name="tu-vi-sex"
                value={value}
                checked={sex === value}
                onChange={() => setSex(value)}
                className="h-4 w-4 accent-insight focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-insight"
              />
              {value} ({value === 'Nam' ? 'male' : 'female'})
            </label>
          ))}
        </div>
        {sexError && (
          <p role="alert" className="text-body-sm text-caution">
            {sexError}
          </p>
        )}
      </fieldset>

      {fieldError && fieldError.field === null && (
        <p role="alert" className="text-body-sm text-caution">
          {fieldError.message}
        </p>
      )}

      {limitBanner && (
        <div role="alert" className="flex flex-col gap-2 rounded-md border border-insight/30 bg-insight/5 px-4 py-3 text-body-sm text-text-primary">
          <span>{limitBanner.message}</span>
          {limitBanner.showUpgrade && (
            <Link href="/premium?reason=required" className="self-start">
              <Button variant="secondary" size="sm">
                Upgrade to Premium
              </Button>
            </Link>
          )}
        </div>
      )}

      <Button type="submit" variant="primary" loading={phase === 'calculating'}>
        {phase === 'calculating' ? 'Calculating your lá số…' : 'Calculate my lá số'}
      </Button>
    </form>
  );
}
