'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';
import type { TarotReadingDto, TarotReadingTypeValue } from '@beaconvie/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { toast } from '@/components/ui/toast';
import { tarotApi } from '../api/tarot-api';
import { TarotReadingView } from './tarot-reading-view';
import { READING_TYPE_DESCRIPTIONS, READING_TYPE_LABELS } from '../labels';

const READING_TYPES: TarotReadingTypeValue[] = ['DAILY_DRAW', 'SINGLE_CARD', 'THREE_CARD'];

/** Phase 6 — Draw animation. A brief, calm "shuffling" pause before the real, already-computed
 * result reveals — never a fake random spin; the deterministic draw already happened server-side
 * by the time this resolves, this is purely a moment of pacing before showing it. */
export function TarotDrawPanel({ onDrawn }: { onDrawn?: (reading: TarotReadingDto) => void }) {
  const queryClient = useQueryClient();
  const [type, setType] = useState<TarotReadingTypeValue>('DAILY_DRAW');
  const [question, setQuestion] = useState('');
  const [phase, setPhase] = useState<'idle' | 'shuffling' | 'revealed'>('idle');
  const [result, setResult] = useState<TarotReadingDto | null>(null);

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
      const message = error instanceof Error ? error.message : "Couldn't draw a card. Please try again.";
      toast.error(message);
    },
  });

  function startDraw() {
    setPhase('shuffling');
    setResult(null);
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
            className={`flex flex-col gap-1 rounded-md border p-3 text-left transition-colors duration-fast ${
              type === t ? 'border-insight bg-surface-raised' : 'border-border-subtle hover:border-insight'
            }`}
          >
            <span className="text-body-sm font-semibold text-text-primary">{READING_TYPE_LABELS[t]}</span>
            <span className="text-caption text-text-secondary">{READING_TYPE_DESCRIPTIONS[t]}</span>
          </button>
        ))}
      </div>

      {type !== 'DAILY_DRAW' && (
        <FormField label="Your question (optional)" htmlFor="tarot-question">
          <Input id="tarot-question" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="What's on your mind?" />
        </FormField>
      )}

      {phase === 'shuffling' ? (
        <div role="status" className="flex items-center justify-center gap-2 py-8 text-body-sm text-text-secondary">
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
