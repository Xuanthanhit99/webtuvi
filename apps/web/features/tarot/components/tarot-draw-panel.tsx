'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';
import type { TarotReadingDto, TarotReadingTypeValue } from '@beaconvie/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { toast } from '@/components/ui/toast';
import { ApiError } from '@/lib/api-error';
import { trackEvent } from '@/lib/analytics';
import { tarotApi } from '../api/tarot-api';
import { TarotReadingView } from './tarot-reading-view';
import { TarotCardVisual } from './tarot-card-face';
import { READING_TYPE_DESCRIPTIONS, READING_TYPE_LABELS } from '../labels';

const READING_TYPES: TarotReadingTypeValue[] = ['DAILY_DRAW', 'SINGLE_CARD', 'THREE_CARD'];

const ANALYTICS_SPREAD_TYPE: Record<TarotReadingTypeValue, 'daily_draw' | 'single_card' | 'three_card'> = {
  DAILY_DRAW: 'daily_draw',
  SINGLE_CARD: 'single_card',
  THREE_CARD: 'three_card',
};

/** Sprint 7 Phase 11 — Tarot UI must clearly explain Premium boundaries, not just show a generic
 * error toast. `PREMIUM_REQUIRED` means upgrading would actually raise this specific ceiling;
 * `TAROT_DAILY_LIMIT_REACHED` means even Premium's (higher) ceiling was hit today — no upsell. */
function drawLimitBanner(error: unknown): { message: string; showUpgrade: boolean } | null {
  if (!(error instanceof ApiError)) return null;
  if (error.code === 'PREMIUM_REQUIRED') return { message: error.message, showUpgrade: true };
  if (error.code === 'TAROT_DAILY_LIMIT_REACHED' || error.code === 'TAROT_DAILY_DRAW_ALREADY_TAKEN') {
    return { message: error.message, showUpgrade: false };
  }
  return null;
}

/** Phase 6 — Draw animation. A brief, calm "shuffling" pause before the real, already-computed
 * result reveals — never a fake random spin; the deterministic draw already happened server-side
 * by the time this resolves, this is purely a moment of pacing before showing it. */
export function TarotDrawPanel({ onDrawn }: { onDrawn?: (reading: TarotReadingDto) => void }) {
  const queryClient = useQueryClient();
  const [type, setType] = useState<TarotReadingTypeValue>('DAILY_DRAW');
  const [question, setQuestion] = useState('');
  const [phase, setPhase] = useState<'idle' | 'shuffling' | 'revealed'>('idle');
  const [result, setResult] = useState<TarotReadingDto | null>(null);
  const [limitBanner, setLimitBanner] = useState<{ message: string; showUpgrade: boolean } | null>(null);

  const draw = useMutation({
    mutationFn: () => tarotApi.draw(type, type === 'DAILY_DRAW' ? undefined : question || undefined),
    onSuccess: async (reading) => {
      await new Promise((resolve) => setTimeout(resolve, 700));
      setResult(reading);
      setPhase('revealed');
      queryClient.invalidateQueries({ queryKey: ['tarot'] });
      onDrawn?.(reading);
    },
    onError: (error: unknown) => {
      setPhase('idle');
      const banner = drawLimitBanner(error);
      if (banner) {
        setLimitBanner(banner);
        return;
      }
      const message = error instanceof Error ? error.message : "Couldn't draw a card. Please try again.";
      toast.error(message);
    },
  });

  function startDraw() {
    setPhase('shuffling');
    setResult(null);
    setLimitBanner(null);
    trackEvent('tarot_started', { feature: 'tarot', spreadType: ANALYTICS_SPREAD_TYPE[type] });
    draw.mutate();
  }

  async function refreshResult() {
    if (!result) return;
    const fresh = await tarotApi.getReading(result.id);
    setResult(fresh);
  }

  if (phase === 'revealed' && result) {
    return (
      <div className="flex flex-col gap-4">
        <TarotReadingView reading={result} onChanged={refreshResult} />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setPhase('idle');
            setResult(null);
          }}
        >
          Draw again
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-md border border-border-subtle bg-surface p-4">
      <div className="grid grid-cols-1 gap-3 tablet:grid-cols-3">
        {READING_TYPES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`group flex min-h-40 flex-col justify-between gap-3 rounded-md border p-3 text-left transition duration-fast hover:-translate-y-0.5 motion-reduce:transform-none ${
              type === t ? 'border-insight bg-surface-raised shadow-[0_18px_48px_rgba(213,173,98,0.08)]' : 'border-border-subtle bg-surface hover:border-insight'
            }`}
          >
            <span className="flex justify-center gap-1.5" aria-hidden="true">
              {(t === 'THREE_CARD' ? [0, 1, 2] : [0]).map((index) => (
                <span
                  key={index}
                  className="scale-[0.5]"
                  style={{ transform: t === 'THREE_CARD' ? `translateY(${index === 1 ? -4 : 4}px)` : undefined }}
                >
                  <TarotCardVisual id={`${t}-${index}`} name={READING_TYPE_LABELS[t]} size="sm" revealed={false} />
                </span>
              ))}
            </span>
            <span>
              <span className="block text-body-sm font-semibold text-text-primary">{READING_TYPE_LABELS[t]}</span>
              <span className="mt-1 block text-caption leading-relaxed text-text-secondary">{READING_TYPE_DESCRIPTIONS[t]}</span>
            </span>
          </button>
        ))}
      </div>

      {type !== 'DAILY_DRAW' && (
        <FormField label="Your question (optional)" htmlFor="tarot-question">
          <Input id="tarot-question" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="What's on your mind?" />
        </FormField>
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

      {phase === 'shuffling' ? (
        <div role="status" className="flex items-center justify-center gap-2 rounded-md border border-insight/20 bg-insight/5 py-8 text-body-sm text-text-secondary">
          <Sparkles className="h-5 w-5 animate-pulse text-insight" aria-hidden="true" />
          <span>Shuffling…</span>
        </div>
      ) : (
        <Button variant="primary" onClick={startDraw} loading={draw.isPending}>
          Draw
        </Button>
      )}
    </div>
  );
}
