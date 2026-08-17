'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, MapPin, CheckCircle2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { GeocodingSearchResultDto, NatalChartDto } from '@beaconvie/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { Checkbox } from '@/components/ui/checkbox';
import { ApiError } from '@/lib/api-error';
import { trackEvent } from '@/lib/analytics';
import { geocodingApi, natalChartApi } from '../api/natal-chart-api';
import { NatalChartView } from './natal-chart-view';

const PLACE_QUERY_MAX_LENGTH = 200;

type FieldName = 'birthDate' | 'birthTime' | 'place' | null;

/** Maps a real backend error code to a plain-language field error — never a raw code shown to the
 * user (mirrors NumerologyForm's own `fieldErrorFor` precedent). */
function fieldErrorFor(error: ApiError): { field: FieldName; message: string } {
  switch (error.code) {
    case 'NATAL_CHART_INVALID_DATE_FORMAT':
    case 'NATAL_CHART_INVALID_CALENDAR_DATE':
    case 'NATAL_CHART_FUTURE_DATE_NOT_ALLOWED':
    case 'NATAL_CHART_DATE_TOO_OLD':
      return { field: 'birthDate', message: error.message };
    case 'NATAL_CHART_INVALID_TIME_FORMAT':
      return { field: 'birthTime', message: error.message };
    case 'NATAL_CHART_LOCATION_NOT_RESOLVED':
      return { field: 'place', message: error.message };
    default:
      return { field: null, message: error.message };
  }
}

/**
 * Phase 3/8/15 — birth data entry: date (required), time (optional, explicitly markable as
 * unknown rather than guessed), and place — resolved through an explicit "Search" action against
 * server-side geocoding (never per-keystroke autocomplete against a third-party service), with
 * the user confirming exactly one candidate before it's carried forward as an opaque token. The
 * client never sends raw coordinates; the server always re-resolves them from the confirmed token
 * (see docs/architecture/natal-chart-discovery.md "Geocoding architecture").
 */
export function BirthInputForm({ onCalculated }: { onCalculated?: (chart: NatalChartDto) => void }) {
  const queryClient = useQueryClient();
  const [birthDate, setBirthDate] = useState('');
  const [birthTimeKnown, setBirthTimeKnown] = useState(true);
  const [birthTime, setBirthTime] = useState('');
  const [placeQuery, setPlaceQuery] = useState('');
  const [candidates, setCandidates] = useState<GeocodingSearchResultDto[] | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<GeocodingSearchResultDto | null>(null);
  const [phase, setPhase] = useState<'idle' | 'calculating' | 'revealed'>('idle');
  const [result, setResult] = useState<NatalChartDto | null>(null);
  const [fieldError, setFieldError] = useState<{ field: FieldName; message: string } | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [limitBanner, setLimitBanner] = useState<{ message: string; showUpgrade: boolean } | null>(null);

  const search = useMutation({
    mutationFn: () => geocodingApi.search(placeQuery.trim()),
    onSuccess: (results) => {
      setCandidates(results);
      setSearchError(null);
    },
    onError: (error: unknown) => {
      setCandidates(null);
      setSearchError(
        error instanceof ApiError && error.code === 'GEOCODING_UNAVAILABLE'
          ? 'Location search is temporarily unavailable. Please try again in a moment.'
          : "Couldn't search for that place. Please try again.",
      );
    },
  });

  const create = useMutation({
    mutationFn: () =>
      natalChartApi.create({
        birthDate,
        birthTime: birthTimeKnown && birthTime ? birthTime : undefined,
        locationToken: selectedCandidate!.token,
      }),
    onSuccess: async (chart) => {
      await new Promise((resolve) => setTimeout(resolve, 700));
      setResult(chart);
      setPhase('revealed');
      queryClient.invalidateQueries({ queryKey: ['natal-chart'] });
      onCalculated?.(chart);
    },
    onError: (error: unknown) => {
      setPhase('idle');
      if (error instanceof ApiError) {
        if (error.code === 'PREMIUM_REQUIRED') {
          setLimitBanner({ message: error.message, showUpgrade: true });
          return;
        }
        if (error.code === 'NATAL_CHART_DAILY_LIMIT_REACHED') {
          setLimitBanner({ message: error.message, showUpgrade: false });
          return;
        }
        setFieldError(fieldErrorFor(error));
        return;
      }
      setFieldError({ field: null, message: "Couldn't calculate your chart. Please try again." });
    },
  });

  function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    setFieldError(null);
    if (placeQuery.trim().length === 0) {
      setFieldError({ field: 'place', message: 'Enter a birth place to search.' });
      return;
    }
    setSelectedCandidate(null);
    search.mutate();
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFieldError(null);
    setLimitBanner(null);

    if (!birthDate) {
      setFieldError({ field: 'birthDate', message: 'Birth date is required.' });
      return;
    }
    if (birthTimeKnown && !birthTime) {
      setFieldError({ field: 'birthTime', message: 'Enter a birth time, or check "I don’t know my birth time."' });
      return;
    }
    if (!selectedCandidate) {
      setFieldError({ field: 'place', message: 'Search for your birth place and select a match.' });
      return;
    }

    setPhase('calculating');
    trackEvent('natal_started', { feature: 'natal_chart' });
    create.mutate();
  }

  if (phase === 'revealed' && result) {
    return (
      <div className="flex flex-col gap-4">
        <NatalChartView
          chart={result}
          onChanged={async () => {
            const fresh = await natalChartApi.getChart(result.id);
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
            setBirthTimeKnown(true);
            setPlaceQuery('');
            setCandidates(null);
            setSelectedCandidate(null);
          }}
        >
          Calculate another chart
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-md border border-border-subtle bg-surface p-4" noValidate>
      <FormField label="Date of birth" htmlFor="natal-chart-birthdate" required error={fieldError?.field === 'birthDate' ? fieldError.message : undefined}>
        <Input
          id="natal-chart-birthdate"
          type="date"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
          max={new Date().toISOString().slice(0, 10)}
          invalid={fieldError?.field === 'birthDate'}
        />
      </FormField>

      <FormField
        label="Time of birth"
        htmlFor="natal-chart-birthtime"
        hint="Your time affects your houses and rising sign — without it, we can still map your planets and signs, just not those."
        error={fieldError?.field === 'birthTime' ? fieldError.message : undefined}
      >
        <div className="flex flex-col gap-2">
          <Input
            id="natal-chart-birthtime"
            type="time"
            value={birthTime}
            onChange={(e) => setBirthTime(e.target.value)}
            disabled={!birthTimeKnown}
            invalid={fieldError?.field === 'birthTime'}
          />
          <Checkbox
            id="natal-chart-birthtime-unknown"
            checked={!birthTimeKnown}
            onChange={(e) => {
              const unknown = e.target.checked;
              setBirthTimeKnown(!unknown);
              if (unknown) setBirthTime('');
            }}
            label="I don’t know my birth time"
          />
        </div>
      </FormField>

      <FormField label="Place of birth" htmlFor="natal-chart-place" required error={fieldError?.field === 'place' ? fieldError.message : undefined}>
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <Input
              id="natal-chart-place"
              value={placeQuery}
              onChange={(e) => {
                setPlaceQuery(e.target.value);
                setSelectedCandidate(null);
                setCandidates(null);
              }}
              placeholder="e.g. Hà Nội, Vietnam"
              maxLength={PLACE_QUERY_MAX_LENGTH}
              invalid={fieldError?.field === 'place'}
            />
            <Button type="button" variant="secondary" onClick={handleSearch} loading={search.isPending}>
              <Search className="h-4 w-4" aria-hidden="true" />
              Search
            </Button>
          </div>

          {searchError && (
            <p role="alert" className="text-body-sm text-caution">
              {searchError}
            </p>
          )}

          {selectedCandidate ? (
            <div className="flex items-center justify-between gap-3 rounded-md border border-trust/30 bg-trust/5 px-3 py-2">
              <span className="flex items-center gap-2 text-body-sm text-text-primary">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-trust" aria-hidden="true" />
                {selectedCandidate.label}
              </span>
              <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedCandidate(null)}>
                Change
              </Button>
            </div>
          ) : (
            candidates &&
            (candidates.length > 0 ? (
              <ul className="flex flex-col gap-1.5" aria-label="Matching places">
                {candidates.map((candidate) => (
                  <li key={candidate.token}>
                    <button
                      type="button"
                      onClick={() => setSelectedCandidate(candidate)}
                      className="flex w-full items-center gap-2 rounded-md border border-border-subtle bg-surface px-3 py-2 text-left text-body-sm text-text-primary transition-colors duration-fast hover:border-insight"
                    >
                      <MapPin className="h-4 w-4 shrink-0 text-text-secondary" aria-hidden="true" />
                      {candidate.label}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-body-sm text-text-secondary">No matching places found. Try a different search.</p>
            ))
          )}
        </div>
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
        {phase === 'calculating' ? 'Calculating your chart…' : 'Calculate my chart'}
      </Button>
    </form>
  );
}
