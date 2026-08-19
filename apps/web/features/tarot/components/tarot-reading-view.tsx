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

  return (
    <div className="flex flex-col gap-4 rounded-md border border-border-subtle bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="insight">{READING_TYPE_LABELS[reading.type]}</Badge>
          <Badge variant={READING_STATUS_BADGE_VARIANT[reading.status]}>{READING_STATUS_LABELS[reading.status]}</Badge>
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

      {reading.question && <p className="text-body-sm text-text-secondary">“{reading.question}”</p>}

      <div className="flex flex-wrap justify-center gap-4 py-2">
        {reading.cards.map((rc) => (
          <div key={rc.position} className="flex flex-col items-center gap-2">
            <TarotCardFace card={rc.card} isReversed={rc.isReversed} onClick={() => setDetailCard({ card: rc.card, isReversed: rc.isReversed })} />
            {rc.positionLabel && <span className="text-caption text-text-tertiary">{rc.positionLabel}</span>}
          </div>
        ))}
      </div>

      <AiInterpretation
        interpretation={reading.interpretation}
        isGenerating={retryInterpretation.isPending}
        onGenerate={() => {
          trackEvent('tarot_interpretation_requested', { feature: 'tarot' });
          retryInterpretation.mutate();
        }}
      />

      <TarotCardDetailDialog
        card={detailCard?.card ?? null}
        isReversed={detailCard?.isReversed ?? false}
        open={detailCard !== null}
        onClose={() => setDetailCard(null)}
      />
    </div>
  );
}
