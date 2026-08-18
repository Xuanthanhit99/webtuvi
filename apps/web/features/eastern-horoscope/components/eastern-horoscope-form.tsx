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
    case 'EASTERN_HOROSCOPE_INVALID_DATE_FORMAT':
    case 'EASTERN_HOROSCOPE_INVALID_DATE':
    case 'EASTERN_HOROSCOPE_DATE_OUT_OF_RANGE':
    case 'EASTERN_HOROSCOPE_FUTURE_DATE':
      return { message: error.message };
    default:
      return { message: error.message };
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
    onSuccess: async (profile) => {
      await new Promise((resolve) => setTimeout(resolve, 400));
      setResult(profile);
      setPhase('revealed');
      queryClient.invalidateQueries({ queryKey: ['eastern-horoscope'] });
      onCalculated?.(profile);
    },
    onError: (error: unknown) => {
      setPhase('idle');
      if (error instanceof ApiError) {
        if (error.code === 'PREMIUM_REQUIRED') {
          setLimitBanner({ message: error.message, showUpgrade: true });
          return;
        }
        if (error.code === 'EASTERN_HOROSCOPE_DAILY_LIMIT_REACHED') {
          setLimitBanner({ message: error.message, showUpgrade: false });
          return;
        }
        setFieldError(fieldErrorFor(error).message);
        return;
      }
      setFieldError('Couldn’t calculate your sign right now. Please try again.');
    },
  });

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFieldError(null);
    setLimitBanner(null);

    if (!birthDate) {
      setFieldError('Birth date is required.');
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
          Check another birth date
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-md border border-border-subtle bg-surface p-4" noValidate>
      <FormField label="Date of birth" htmlFor="eastern-horoscope-birthdate" required error={fieldError ?? undefined}>
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
        A birth date close to Lunar New Year may belong to the previous zodiac year rather than the Gregorian calendar year it
        falls in — this is expected and calculated correctly using the real lunisolar calendar.
      </p>

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
        {phase === 'calculating' ? 'Calculating…' : 'Reveal my sign'}
      </Button>
    </form>
  );
}
