'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { NumerologyReadingDto } from '@beaconvie/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { numerologyApi } from '../api/numerology-api';
import { NumerologyValueCard } from './numerology-value-card';
import { READING_STATUS_BADGE_VARIANT, READING_STATUS_LABELS, VALUE_TYPE_ORDER } from '../labels';

/** Phase 6 — a reading's core numbers, interpretation, and lifecycle actions. Every value rendered
 * here is the real, already-persisted result the backend calculated — nothing is invented
 * client-side (mirrors TarotReadingView's own precedent). */
export function NumerologyReadingView({ reading, onChanged }: { reading: NumerologyReadingDto; onChanged?: () => void }) {
  const queryClient = useQueryClient();
  const { data: meanings } = useQuery({
    queryKey: ['numerology', 'meanings'],
    queryFn: numerologyApi.listMeanings,
    staleTime: Infinity,
  });
  const meaningFor = (type: string, value: number) => meanings?.find((m) => m.type === type && m.value === value);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['numerology'] });
    onChanged?.();
  };

  const retryInterpretation = useMutation({
    mutationFn: () => numerologyApi.retryInterpretation(reading.id),
    onSuccess: invalidate,
    onError: () => toast.error("Couldn't generate an interpretation. Please try again."),
  });
  const archive = useMutation({
    mutationFn: () => numerologyApi.archiveReading(reading.id),
    onSuccess: () => {
      invalidate();
      toast.success('Reading archived.');
    },
    onError: () => toast.error("Couldn't archive that reading."),
  });
  const restore = useMutation({
    mutationFn: () => numerologyApi.restoreReading(reading.id),
    onSuccess: () => {
      invalidate();
      toast.success('Reading restored.');
    },
    onError: () => toast.error("Couldn't restore that reading."),
  });
  const remove = useMutation({
    mutationFn: () => numerologyApi.deleteReading(reading.id),
    onSuccess: () => {
      invalidate();
      toast.success('Reading deleted.');
    },
    onError: () => toast.error("Couldn't delete that reading."),
  });

  const orderedValues = [...reading.values].sort((a, b) => VALUE_TYPE_ORDER.indexOf(a.type) - VALUE_TYPE_ORDER.indexOf(b.type));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border-subtle bg-surface p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={READING_STATUS_BADGE_VARIANT[reading.status]}>{READING_STATUS_LABELS[reading.status]}</Badge>
          <span className="text-caption text-text-secondary">
            Calculated for <span className="font-medium text-text-primary">{reading.normalizedBirthName}</span>, born {reading.birthDate}
          </span>
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

      <div className="grid gap-4 tablet:grid-cols-2">
        {orderedValues.map((entry) => (
          <NumerologyValueCard key={entry.type} entry={entry} meaning={meaningFor(entry.type, entry.value)} />
        ))}
      </div>

      {reading.interpretation ? (
        <p className="rounded-md border border-border-subtle bg-surface p-4 text-body-md text-text-primary">{reading.interpretation}</p>
      ) : (
        <div className="flex items-center justify-between gap-3 rounded-md border border-dashed border-border-subtle p-3">
          <p className="text-body-sm text-text-secondary">Interpretation isn’t ready yet.</p>
          <Button variant="secondary" size="sm" onClick={() => retryInterpretation.mutate()} loading={retryInterpretation.isPending}>
            Generate interpretation
          </Button>
        </div>
      )}
    </div>
  );
}
