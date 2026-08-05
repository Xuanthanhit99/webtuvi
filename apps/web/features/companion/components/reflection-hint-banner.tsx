'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';
import { companionReflectionApi } from '../api/companion-reflection-api';

/**
 * Phase 10 — Companion's one, fixed, deterministic Reflection nudge: "You may want to reflect on
 * this." Rendered only when `GET /companion/reflection-hint` reports a real, currently-`READY`
 * candidate exists — never generated, fabricated, summarized, or coached on demand. A failed or
 * loading fetch renders nothing (a missing nudge is never worth an error state in a conversation
 * view). See docs/architecture/reflection-foundation.md "Companion integration".
 */
export function ReflectionHintBanner() {
  const { data } = useQuery({
    queryKey: ['companion', 'reflection-hint'],
    queryFn: companionReflectionApi.hint,
    staleTime: 60_000,
  });

  if (!data?.available || !data.reflectionId) return null;

  return (
    <Link
      href={`/reflections?item=${data.reflectionId}`}
      className="mb-4 flex items-center gap-2 rounded-md border border-insight/30 bg-insight/5 px-3 py-2 text-body-sm text-text-primary transition-colors duration-fast hover:bg-insight/10"
    >
      <Sparkles className="h-4 w-4 shrink-0 text-insight" aria-hidden="true" />
      You may want to reflect on this.
    </Link>
  );
}
