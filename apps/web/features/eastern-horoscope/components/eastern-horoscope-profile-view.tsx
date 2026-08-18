'use client';

import { useState } from 'react';
import type { EasternHoroscopeProfileDto } from '@beaconvie/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ApiError } from '@/lib/api-error';
import { easternHoroscopeApi } from '../api/eastern-horoscope-api';
import { ELEMENT_LABELS_EN, YIN_YANG_LABELS_EN, YEAR_ENERGY_RELATIONSHIP_LABELS } from '../labels';

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
      setInterpretError(error instanceof ApiError ? error.message : 'Couldn’t generate an interpretation right now. Please try again.');
    } finally {
      setInterpretLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <p className="font-display text-body-lg text-text-primary">Your sign</p>
          <Badge variant="new">Deterministic — never AI-generated</Badge>
        </div>
        <div className="grid gap-3 desktop:grid-cols-2">
          <Fact label="Zodiac animal" value={`${profile.zodiacAnimal.vi} (${profile.zodiacAnimal.en})`} />
          <Fact label="Element" value={`${profile.element} (${ELEMENT_LABELS_EN[profile.element] ?? profile.element})`} />
          <Fact label="Yin / Yang" value={`${profile.yinYang} (${YIN_YANG_LABELS_EN[profile.yinYang] ?? profile.yinYang})`} />
          <Fact label="Heavenly Stem / Earthly Branch" value={`${profile.stem} ${profile.branch}`} />
        </div>
        <p className="mt-3 text-body-sm text-text-tertiary">Calculated from your birth date ({profile.birthDate}) using a real lunisolar calendar — never approximated by AI.</p>
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <p className="font-display text-body-lg text-text-primary">This year’s energy — {profile.yearEnergy.calendarYear}</p>
          <Badge variant="new">Deterministic — never AI-generated</Badge>
        </div>
        <div className="grid gap-3 desktop:grid-cols-2">
          <Fact label="This year’s sign" value={`${profile.yearEnergy.yearZodiacAnimal.vi} (${profile.yearEnergy.yearZodiacAnimal.en})`} />
          <Fact label="This year’s element" value={`${profile.yearEnergy.yearElement} (${ELEMENT_LABELS_EN[profile.yearEnergy.yearElement] ?? profile.yearEnergy.yearElement})`} />
        </div>
        <p className="mt-3 text-body-sm text-text-secondary">{YEAR_ENERGY_RELATIONSHIP_LABELS[profile.yearEnergy.relationship]}</p>
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <p className="font-display text-body-lg text-text-primary">Reflection</p>
          <Badge variant="insight">AI interpretation</Badge>
        </div>
        {profile.interpretation && !profile.interpretationStale ? (
          <p className="whitespace-pre-wrap text-body-md text-text-primary">{profile.interpretation}</p>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-body-sm text-text-secondary">
              {profile.interpretationStale
                ? 'Your last reflection was written for a previous calendar year — generate a fresh one for this year.'
                : 'No reflection generated yet for this year.'}
            </p>
            {interpretError && (
              <p role="alert" className="text-body-sm text-caution">
                {interpretError}
              </p>
            )}
            <Button variant="secondary" size="sm" loading={interpretLoading} onClick={handleInterpret} className="self-start">
              {interpretLoading ? 'Reflecting…' : 'Generate reflection'}
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
