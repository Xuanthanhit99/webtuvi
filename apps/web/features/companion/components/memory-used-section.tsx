'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { MemoryReferenceDto, MemorySkipReferenceDto, MemoryExplanationDto, MemorySkipExplanationDto } from '@beaconvie/types';
import { companionMemoryApi } from '../api/companion-memory-api';
import { MemoryCard } from './memory-card';
import { Skeleton } from '@/components/ui/skeleton';

function formatExplanation(dto: MemoryExplanationDto): string {
  return `${dto.headline} ${dto.reason} ${dto.source} ${dto.consent}`;
}

function MemoryUsedItem({ conversationId, messageId, reference }: { conversationId: string; messageId: string; reference: MemoryReferenceDto }) {
  const [showWhy, setShowWhy] = useState(false);

  const { data: explanation, isLoading } = useQuery({
    queryKey: ['memory-explanation', conversationId, messageId, reference.memoryId],
    queryFn: () => companionMemoryApi.explainUsedMemory(conversationId, messageId, reference.memoryId),
    enabled: showWhy,
  });

  return (
    <div className="flex flex-col gap-1">
      <MemoryCard reference={reference} explanationText={showWhy && explanation ? formatExplanation(explanation) : undefined} />
      <button
        type="button"
        onClick={() => setShowWhy((v) => !v)}
        className="self-start text-caption text-text-disabled underline decoration-dotted hover:text-text-secondary"
      >
        {showWhy ? 'Hide' : 'Why I remembered this'}
      </button>
      {showWhy && isLoading && <Skeleton className="h-4 w-2/3" />}
    </div>
  );
}

function SkippedMemoryItem({ skip }: { skip: MemorySkipReferenceDto & { explanation: MemorySkipExplanationDto } }) {
  return (
    <div className="rounded-sm bg-surface-raised px-2 py-1.5 text-caption text-text-secondary">
      <p className="font-medium text-text-primary">{skip.title}</p>
      <p>
        {skip.explanation.headline} {skip.explanation.reason}
      </p>
    </div>
  );
}

export interface MemoryUsedSectionProps {
  conversationId: string;
  messageId: string;
  /** Persisted references — available on reload, "later retrieval" in the Phase 13 flow. */
  used: MemoryReferenceDto[];
  /** Ephemeral, this-turn-only — only ever passed for the message that was just generated. */
  skipped?: (MemorySkipReferenceDto & { explanation: MemorySkipExplanationDto })[];
}

/** Phase 10: "Memory Used" / "Why I ignored" companion UI, built entirely from data the backend
 * already returned — never fetches or guesses beyond what's given. */
export function MemoryUsedSection({ conversationId, messageId, used, skipped }: MemoryUsedSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const [showSkipped, setShowSkipped] = useState(false);

  if (used.length === 0 && (!skipped || skipped.length === 0)) return null;

  return (
    <div className="mt-2 flex flex-col gap-2 border-t border-border-subtle pt-2">
      <div className="flex flex-wrap gap-3">
        {used.length > 0 && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-caption font-medium text-insight hover:underline"
          >
            {expanded ? 'Hide' : 'Show'} memory used ({used.length})
          </button>
        )}
        {skipped && skipped.length > 0 && (
          <button
            type="button"
            onClick={() => setShowSkipped((v) => !v)}
            className="text-caption font-medium text-text-secondary hover:underline"
          >
            {showSkipped ? 'Hide' : 'Show'} why I ignored {skipped.length === 1 ? 'something' : 'a few things'}
          </button>
        )}
      </div>

      {expanded && (
        <div className="flex flex-col gap-3">
          {used.map((reference) => (
            <MemoryUsedItem key={reference.memoryId} conversationId={conversationId} messageId={messageId} reference={reference} />
          ))}
        </div>
      )}

      {showSkipped && skipped && (
        <div className="flex flex-col gap-2">
          {skipped.map((skip) => (
            <SkippedMemoryItem key={skip.memoryId} skip={skip} />
          ))}
        </div>
      )}
    </div>
  );
}
