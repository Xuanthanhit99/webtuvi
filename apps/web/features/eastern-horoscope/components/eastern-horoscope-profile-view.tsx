'use client';

import { useState } from 'react';
import type { EasternHoroscopeProfileDto } from '@beaconvie/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ApiError } from '@/lib/api-error';
import { easternHoroscopeApi } from '../api/eastern-horoscope-api';
import { YEAR_ENERGY_RELATIONSHIP_LABELS } from '../labels';

/**
 * The canonical, deterministic facts (Stem/Branch/Element/Yin-Yang/zodiac animal, Year Energy)
 * render first and are visually and textually labeled "Deterministic — never AI-generated",
 * matching this product's established fact-vs-AI separation discipline (Reports, Natal Chart) —
 * never a wall of AI prose as the first thing shown (Bible Module 14 §5, "Overview first").
 */
export function EasternHoroscopeProfileView({ profile, onChanged }: { profile: EasternHoroscopeProfileDto; onChanged?: () => void | Promise<void> }) {
  const [interpretLoading, setInterpretLoading] = useState(false);
  const [interpretError, setInterpretError] = useState<string | null>(null);

  async function handleInterpret() {
    setInterpretLoading(true);
    setInterpretError(null);
    try {
      await easternHoroscopeApi.retryInterpretation(profile.id);
      await onChanged?.();
    } catch (error) {
      setInterpretError(error instanceof ApiError ? error.message : 'Không thể tạo diễn giải lúc này. Vui lòng thử lại.');
    } finally {
      setInterpretLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <p className="font-display text-body-lg text-text-primary">Bản mệnh của bạn</p>
          <Badge variant="new">Dữ kiện cố định, không do AI tạo</Badge>
        </div>
        <div className="grid gap-3 desktop:grid-cols-2">
          <Fact label="Con giáp" value={profile.zodiacAnimal.vi} />
          <Fact label="Ngũ hành" value={profile.element} />
          <Fact label="Âm / Dương" value={profile.yinYang} />
          <Fact label="Thiên Can / Địa Chi" value={`${profile.stem} ${profile.branch}`} />
        </div>
        <p className="mt-3 text-body-sm text-text-tertiary">Được tính từ ngày sinh của bạn ({profile.birthDate}) bằng lịch âm dương thực tế — không do AI ước lượng.</p>
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <p className="font-display text-body-lg text-text-primary">Vận khí năm nay — {profile.yearEnergy.calendarYear}</p>
          <Badge variant="new">Dữ kiện cố định, không do AI tạo</Badge>
        </div>
        <div className="grid gap-3 desktop:grid-cols-2">
          <Fact label="Con giáp năm nay" value={profile.yearEnergy.yearZodiacAnimal.vi} />
          <Fact label="Ngũ hành năm nay" value={profile.yearEnergy.yearElement} />
        </div>
        <p className="mt-3 text-body-sm text-text-secondary">{YEAR_ENERGY_RELATIONSHIP_LABELS[profile.yearEnergy.relationship]}</p>
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <p className="font-display text-body-lg text-text-primary">Chiêm nghiệm</p>
          <Badge variant="insight">Diễn giải AI</Badge>
        </div>
        {profile.interpretation && !profile.interpretationStale ? (
          <p className="whitespace-pre-wrap text-body-md text-text-primary">{profile.interpretation}</p>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-body-sm text-text-secondary">
              {profile.interpretationStale
                ? 'Chiêm nghiệm gần nhất của bạn được viết cho năm dương lịch trước — hãy tạo một bản mới cho năm nay.'
                : 'Chưa có chiêm nghiệm nào được tạo cho năm nay.'}
            </p>
            {interpretError && (
              <p role="alert" className="text-body-sm text-caution">
                {interpretError}
              </p>
            )}
            <Button variant="secondary" size="sm" loading={interpretLoading} onClick={handleInterpret} className="self-start">
              {interpretLoading ? 'Đang chiêm nghiệm…' : 'Tạo chiêm nghiệm'}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-body-xs uppercase tracking-wide text-text-tertiary">{label}</p>
      <p className="text-body-md text-text-primary">{value}</p>
    </div>
  );
}
