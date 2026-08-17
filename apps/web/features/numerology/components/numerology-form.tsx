'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { NumerologyReadingDto } from '@beaconvie/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { ApiError } from '@/lib/api-error';
import { trackEvent } from '@/lib/analytics';
import { numerologyApi } from '../api/numerology-api';
import { NumerologyReadingView } from './numerology-reading-view';

const NAME_MAX_LENGTH = 200;

/** Maps a real backend error code to a plain-language field error — never a raw code shown to the
 * user. Anything not recognized here falls through to a generic top-level banner. */
function fieldErrorFor(error: ApiError): { field: 'fullBirthName' | 'birthDate' | null; message: string } {
  switch (error.code) {
    case 'NUMEROLOGY_NAME_EMPTY':
    case 'NUMEROLOGY_NAME_TRANSLITERATION_UNSUPPORTED':
      return { field: 'fullBirthName', message: error.message };
    case 'NUMEROLOGY_INVALID_DATE_FORMAT':
    case 'NUMEROLOGY_INVALID_CALENDAR_DATE':
    case 'NUMEROLOGY_FUTURE_DATE_NOT_ALLOWED':
    case 'NUMEROLOGY_DATE_TOO_OLD':
      return { field: 'birthDate', message: error.message };
    default:
      return { field: null, message: error.message };
  }
}

/** Phase 12/16 — input form -> calculate -> reveal. A brief, calm "calculating" pause (the real
 * deterministic calculation already completed server-side by the time this resolves) before
 * showing the real result, mirroring TarotDrawPanel's own pacing precedent. */
export function NumerologyForm({ onCalculated }: { onCalculated?: (reading: NumerologyReadingDto) => void }) {
  const queryClient = useQueryClient();
  const [fullBirthName, setFullBirthName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [phase, setPhase] = useState<'idle' | 'calculating' | 'revealed'>('idle');
  const [result, setResult] = useState<NumerologyReadingDto | null>(null);
  const [fieldError, setFieldError] = useState<{ field: 'fullBirthName' | 'birthDate' | null; message: string } | null>(null);
  const [limitBanner, setLimitBanner] = useState<{ message: string; showUpgrade: boolean } | null>(null);

  const calculate = useMutation({
    mutationFn: () => numerologyApi.calculate(fullBirthName.trim(), birthDate),
    onSuccess: async (reading) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setResult(reading);
      setPhase('revealed');
      queryClient.invalidateQueries({ queryKey: ['numerology'] });
      onCalculated?.(reading);
    },
    onError: (error: unknown) => {
      setPhase('idle');
      if (error instanceof ApiError) {
        if (error.code === 'PREMIUM_REQUIRED') {
          setLimitBanner({ message: error.message, showUpgrade: true });
          return;
        }
        if (error.code === 'NUMEROLOGY_DAILY_LIMIT_REACHED') {
          setLimitBanner({ message: error.message, showUpgrade: false });
          return;
        }
        setFieldError(fieldErrorFor(error));
        return;
      }
      setFieldError({ field: null, message: "Couldn't calculate your numbers. Please try again." });
    },
  });

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFieldError(null);
    setLimitBanner(null);

    if (fullBirthName.trim().length === 0) {
      setFieldError({ field: 'fullBirthName', message: 'Full birth name is required.' });
      return;
    }
    if (fullBirthName.trim().length > NAME_MAX_LENGTH) {
      setFieldError({ field: 'fullBirthName', message: `Full birth name must be ${NAME_MAX_LENGTH} characters or fewer.` });
      return;
    }
    if (!birthDate) {
      setFieldError({ field: 'birthDate', message: 'Birth date is required.' });
      return;
    }

    setPhase('calculating');
    trackEvent('numerology_started', { feature: 'numerology' });
    calculate.mutate();
  }

  if (phase === 'revealed' && result) {
    return (
      <div className="flex flex-col gap-4">
        <NumerologyReadingView
          reading={result}
          onChanged={async () => {
            const fresh = await numerologyApi.getReading(result.id);
            setResult(fresh);
          }}
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setPhase('idle');
            setResult(null);
            setFullBirthName('');
            setBirthDate('');
          }}
        >
          Calculate another reading
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-md border border-border-subtle bg-surface p-4" noValidate>
      <FormField label="Full birth name" htmlFor="numerology-name" required error={fieldError?.field === 'fullBirthName' ? fieldError.message : undefined}>
        <Input
          id="numerology-name"
          value={fullBirthName}
          onChange={(e) => setFullBirthName(e.target.value)}
          placeholder="e.g. Nguyễn Văn An"
          maxLength={NAME_MAX_LENGTH}
          invalid={fieldError?.field === 'fullBirthName'}
          autoComplete="name"
        />
      </FormField>

      <FormField label="Date of birth" htmlFor="numerology-birthdate" required error={fieldError?.field === 'birthDate' ? fieldError.message : undefined}>
        <Input
          id="numerology-birthdate"
          type="date"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
          max={new Date().toISOString().slice(0, 10)}
          invalid={fieldError?.field === 'birthDate'}
        />
      </FormField>

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
        {phase === 'calculating' ? 'Calculating…' : 'Calculate my numbers'}
      </Button>
    </form>
  );
}
