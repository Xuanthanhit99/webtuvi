'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { TarotCardDto, TarotReadingDto } from '@beaconvie/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AiInterpretation } from '@/components/ui/ai-interpretation';
import { toast } from '@/components/ui/toast';
import { tarotApi } from '../api/tarot-api';
import { trackEvent } from '@/lib/analytics';
import { TarotCardFace } from './tarot-card-face';
import { TarotCardDetailDialog } from './tarot-card-detail-dialog';
import { resolveTarotArtworkSrc } from '../artwork';
import { READING_STATUS_BADGE_VARIANT, READING_STATUS_LABELS, READING_TYPE_LABELS } from '../labels';

/** Phase 6 — a reading's cards, interpretation, and lifecycle actions. Every card face links to
 * the same real deterministic result the backend persisted — nothing rendered here is invented
 * client-side. */
export function TarotReadingView({ reading, onChanged }: { reading: TarotReadingDto; onChanged?: () => void }) {
  const queryClient = useQueryClient();
  const [detailCard, setDetailCard] = useState<{ card: TarotCardDto; isReversed: boolean } | null>(null);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['tarot'] });
    onChanged?.();
  };

  const retryInterpretation = useMutation({
    mutationFn: () => tarotApi.retryInterpretation(reading.id),
    onSuccess: invalidate,
    onError: () => toast.error("Couldn't generate an interpretation. Please try again."),
  });
  const archive = useMutation({
    mutationFn: () => tarotApi.archiveReading(reading.id),
    onSuccess: () => {
      invalidate();
      toast.success('Reading archived.');
    },
    onError: () => toast.error("Couldn't archive that reading."),
  });
  const restore = useMutation({
    mutationFn: () => tarotApi.restoreReading(reading.id),
    onSuccess: () => {
      invalidate();
      toast.success('Reading restored.');
    },
    onError: () => toast.error("Couldn't restore that reading."),
  });
  const remove = useMutation({
    mutationFn: () => tarotApi.deleteReading(reading.id),
    onSuccess: () => {
      invalidate();
      toast.success('Reading deleted.');
    },
    onError: () => toast.error("Couldn't delete that reading."),
  });

  const orderedCards = [...reading.cards].sort((a, b) => a.position - b.position);

  return (
    <div className="relative flex flex-col gap-5 overflow-hidden rounded-md border border-[rgba(213,173,98,0.34)] bg-[#07111D] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.34)] before:pointer-events-none before:absolute before:inset-0 before:opacity-25 before:[background-image:radial-gradient(circle,rgba(234,194,126,0.78)_1px,transparent_1.4px),radial-gradient(circle,rgba(236,232,220,0.28)_1px,transparent_1.6px)] before:[background-position:0_0,18px_22px] before:[background-size:48px_48px,76px_76px] tablet:p-5">
      <div className="relative flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="insight">{READING_TYPE_LABELS[reading.type]}</Badge>
          <Badge variant={READING_STATUS_BADGE_VARIANT[reading.status]}>{READING_STATUS_LABELS[reading.status]}</Badge>
          <Badge variant="neutral">{reading.spreadName}</Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          {reading.status === 'ACTIVE' && (
            <Button variant="ghost" size="sm" onClick={() => archive.mutate()} loading={archive.isPending}>
              Archive
            </Button>
          )}
          {reading.status !== 'ACTIVE' && (
            <Button variant="secondary" size="sm" onClick={() => restore.mutate()} loading={restore.isPending}>
              Restore
            </Button>
          )}
          {reading.status !== 'DELETED' && (
            <Button variant="ghost" size="sm" onClick={() => remove.mutate()} loading={remove.isPending}>
              Delete
            </Button>
          )}
        </div>
      </div>

      {reading.question && (
        <div className="relative rounded-md border border-[rgba(213,173,98,0.18)] bg-[#0A1622]/85 px-3 py-2">
          <p className="text-caption text-text-tertiary">Câu hỏi</p>
          <p className="text-body-sm text-text-secondary">“{reading.question}”</p>
        </div>
      )}

      <div className="relative flex flex-wrap justify-center gap-4 border-y border-[rgba(213,173,98,0.14)] py-5">
        {orderedCards.map((rc, index) => (
          <div key={rc.position} className="flex flex-col items-center gap-2">
            <TarotCardFace
              card={rc.card}
              isReversed={rc.isReversed}
              imageSrc={resolveTarotArtworkSrc(rc.card)}
              size="lg"
              onClick={() => setDetailCard({ card: rc.card, isReversed: rc.isReversed })}
            />
            <span className="text-caption font-semibold text-insight">{rc.positionLabel ?? `Vị trí ${index + 1}`}</span>
            <span className="rounded-full border border-insight/25 bg-[#17172D] px-2 py-0.5 text-caption font-semibold text-insight" aria-label={`Orientation ${rc.isReversed ? 'Ngược' : 'Xuôi'}`}>
              {rc.isReversed ? 'Ngược' : 'Xuôi'}
            </span>
          </div>
        ))}
      </div>

      <section className="relative grid gap-3 tablet:grid-cols-2">
        {orderedCards.map((rc, index) => {
          const meaning = rc.isReversed ? rc.card.reversedMeaning : rc.card.uprightMeaning;
          const keywords = rc.isReversed ? rc.card.reversedKeywords : rc.card.uprightKeywords;
          return (
            <article key={`${rc.position}-meaning`} className="rounded-md border border-[rgba(213,173,98,0.2)] bg-[#0A1622]/90 p-4">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge variant="neutral">{rc.positionLabel ?? `Vị trí ${index + 1}`}</Badge>
                <Badge variant="insight">{rc.isReversed ? 'Ngược' : 'Xuôi'}</Badge>
              </div>
              <h3 className="font-display text-heading-md text-text-primary">{rc.card.name}</h3>
              <p className="text-body-sm text-text-secondary">{rc.card.nameVi}</p>
              <p className="mt-3 text-body-sm text-text-primary">{meaning}</p>
              <p className="mt-3 text-caption text-text-tertiary">{keywords.join(' · ')}</p>
              <div className="mt-4 grid gap-2 text-caption text-text-secondary">
                <p><span className="font-semibold text-text-primary">Tình cảm:</span> {rc.card.loveMeaning}</p>
                <p><span className="font-semibold text-text-primary">Sự nghiệp:</span> {rc.card.careerMeaning}</p>
                <p><span className="font-semibold text-text-primary">Tài chính:</span> {rc.card.financeMeaning}</p>
                <p><span className="font-semibold text-text-primary">Bản thân:</span> {rc.card.selfMeaning}</p>
              </div>
            </article>
          );
        })}
      </section>

      <section className="relative rounded-md border border-[rgba(213,173,98,0.2)] bg-[#0A1622]/85 p-4">
        <h3 className="font-display text-heading-md text-insight">Có thể bạn muốn tự hỏi...</h3>
        <ul className="mt-3 grid gap-2 tablet:grid-cols-2">
          {orderedCards.flatMap((rc) => rc.card.reflectionPrompts.map((prompt) => ({ prompt, cardId: rc.card.id }))).map(({ prompt, cardId }) => (
            <li key={`${cardId}-${prompt}`} className="rounded-sm border border-[rgba(213,173,98,0.12)] bg-[#101827] px-3 py-2 text-body-sm text-text-secondary">
              {prompt}
            </li>
          ))}
        </ul>
      </section>

      <section className="relative rounded-md border border-insight/25 bg-[#17172D]/75 p-3">
        <AiInterpretation
          interpretation={reading.interpretation}
          isGenerating={retryInterpretation.isPending}
          onGenerate={() => {
            trackEvent('tarot_interpretation_requested', { feature: 'tarot' });
            retryInterpretation.mutate();
          }}
        />
      </section>

      <TarotCardDetailDialog
        card={detailCard?.card ?? null}
        isReversed={detailCard?.isReversed ?? false}
        open={detailCard !== null}
        onClose={() => setDetailCard(null)}
      />
    </div>
  );
}
