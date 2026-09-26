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
      return { field: 'birthDate', message: 'Ngày sinh không hợp lệ. Vui lòng kiểm tra lại.' };
    case 'NATAL_CHART_FUTURE_DATE_NOT_ALLOWED':
      return { field: 'birthDate', message: 'Ngày sinh không thể ở tương lai.' };
    case 'NATAL_CHART_DATE_TOO_OLD':
      return { field: 'birthDate', message: 'Ngày sinh nằm ngoài khoảng thời gian có thể tính.' };
    case 'NATAL_CHART_INVALID_TIME_FORMAT':
      return { field: 'birthTime', message: 'Giờ sinh không hợp lệ. Vui lòng nhập theo định dạng 24 giờ.' };
    case 'NATAL_CHART_LOCATION_NOT_RESOLVED':
      return { field: 'place', message: 'Không xác định được nơi sinh. Vui lòng tìm và chọn lại địa điểm.' };
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
          ? 'Tìm kiếm địa điểm tạm thời không khả dụng. Vui lòng thử lại sau ít phút.'
          : 'Chưa thể tìm địa điểm này. Vui lòng thử lại.',
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
    onSuccess: (chart) => {
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
      setFieldError({ field: null, message: 'Chưa thể lập bản đồ sao. Vui lòng thử lại.' });
    },
  });

  function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    setFieldError(null);
    if (placeQuery.trim().length === 0) {
      setFieldError({ field: 'place', message: 'Nhập nơi sinh để tìm kiếm.' });
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
      setFieldError({ field: 'birthDate', message: 'Vui lòng nhập ngày sinh.' });
      return;
    }
    if (birthTimeKnown && !birthTime) {
      setFieldError({ field: 'birthTime', message: 'Nhập giờ sinh, hoặc chọn "Tôi không biết giờ sinh".' });
      return;
    }
    if (!selectedCandidate) {
      setFieldError({ field: 'place', message: 'Tìm nơi sinh và chọn một kết quả phù hợp.' });
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
          Lập bản đồ khác
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5 rounded-md border border-[#d5ad62]/25 bg-[#06111d] p-4 tablet:grid-cols-[minmax(0,1fr)_18rem]" noValidate>
      <div className="flex flex-col gap-4">
        <FormField label="Ngày sinh" htmlFor="natal-chart-birthdate" required error={fieldError?.field === 'birthDate' ? fieldError.message : undefined}>
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
          label="Giờ sinh"
          htmlFor="natal-chart-birthtime"
          hint="Giờ sinh ảnh hưởng đến các nhà và Cung Mọc — nếu không có, Mệnh Vi vẫn tính được vị trí hành tinh và cung hoàng đạo, chỉ trừ hai phần này."
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
              label="Tôi không biết giờ sinh"
            />
          </div>
        </FormField>

        <FormField label="Nơi sinh" htmlFor="natal-chart-place" required error={fieldError?.field === 'place' ? fieldError.message : undefined}>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2 tablet:flex-row">
              <Input
                id="natal-chart-place"
                value={placeQuery}
                onChange={(e) => {
                  setPlaceQuery(e.target.value);
                  setSelectedCandidate(null);
                  setCandidates(null);
                }}
                placeholder="Ví dụ: Hà Nội, Việt Nam"
                maxLength={PLACE_QUERY_MAX_LENGTH}
                invalid={fieldError?.field === 'place'}
              />
              <Button type="button" variant="secondary" onClick={handleSearch} loading={search.isPending}>
                <Search className="h-4 w-4" aria-hidden="true" />
                Tìm kiếm
              </Button>
            </div>

            {searchError && (
              <p role="alert" className="text-body-sm text-caution">
                {searchError}
              </p>
            )}

            {selectedCandidate ? (
              <div className="flex items-center justify-between gap-3 rounded-md border border-[#59c7b5]/35 bg-[#59c7b5]/10 px-3 py-2">
                <span className="flex items-center gap-2 text-body-sm text-text-primary">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[#8ddbd0]" aria-hidden="true" />
                  {selectedCandidate.label}
                </span>
                <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedCandidate(null)}>
                  Đổi
                </Button>
              </div>
            ) : (
              candidates &&
              (candidates.length > 0 ? (
                <ul className="flex flex-col gap-1.5" aria-label="Địa điểm phù hợp">
                  {candidates.map((candidate) => (
                    <li key={candidate.token}>
                      <button
                        type="button"
                        onClick={() => setSelectedCandidate(candidate)}
                        className="flex w-full items-center gap-2 rounded-md border border-[#d5ad62]/20 bg-[#071827] px-3 py-2 text-left text-body-sm text-text-primary transition-colors duration-fast hover:border-[#d5ad62]/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-insight"
                      >
                        <MapPin className="h-4 w-4 shrink-0 text-[#efb96c]" aria-hidden="true" />
                        {candidate.label}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-body-sm text-text-secondary">Không tìm thấy địa điểm phù hợp. Hãy thử từ khóa khác.</p>
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
                  Nâng cấp Premium
                </Button>
              </Link>
            )}
          </div>
        )}

        <Button type="submit" variant="primary" loading={phase === 'calculating'}>
          {phase === 'calculating' ? 'Đang lập bản đồ sao…' : 'Lập bản đồ sao'}
        </Button>
      </div>

      <aside className="rounded-md border border-[#d5ad62]/20 bg-[#071827]/85 p-4 text-body-sm text-text-secondary">
        <p className="font-serif text-heading-sm text-[#efb96c]">Dữ liệu được chuẩn hóa</p>
        <p className="mt-2">Nơi sinh được xác nhận từ kết quả tìm kiếm; tọa độ và múi giờ được xử lý tự động để lập bản đồ chính xác.</p>
        <div className="mt-5 grid grid-cols-2 gap-2 text-caption">
          <span className="rounded-md border border-[#d5ad62]/20 px-3 py-2">Hoàng đạo nhiệt đới</span>
          <span className="rounded-md border border-[#d5ad62]/20 px-3 py-2">Placidus</span>
          <span className="rounded-md border border-[#d5ad62]/20 px-3 py-2">Góc hợp chính</span>
          <span className="rounded-md border border-[#d5ad62]/20 px-3 py-2">Lưu lịch sử</span>
        </div>
      </aside>
    </form>
  );
}
