'use client';

import Link from 'next/link';
import type { ReflectionSourceDto } from '@beaconvie/types';
import { SOURCE_TYPE_LABELS } from '../labels';

/** Renders exactly the real source records a candidate cites — never a summary, never inferred
 * content. `MEMORY`/`JOURNAL` sources deep-link to their own real detail view (the same `?item=id`
 * pattern those pages already use); `ACTIVITY`/`COMPANION` sources have no standalone detail view
 * in this product today, so they render as plain, non-clickable evidence rows rather than a link
 * to nowhere. */
export function ReflectionSourceViewer({ sources }: { sources: ReflectionSourceDto[] }) {
  if (sources.length === 0) return null;

  return (
    <ul className="flex flex-col gap-2" aria-label="Supporting evidence">
      {sources.map((source, index) => {
        const key = `${source.sourceType}:${source.sourceId}:${index}`;
        const label = SOURCE_TYPE_LABELS[source.sourceType];
        const when = new Date(source.sourceTimestamp).toLocaleDateString();
        const content = (
          <>
            <span className="text-body-sm font-medium text-text-primary">{label}</span>
            <span className="text-caption text-text-disabled">{when}</span>
          </>
        );

        if (source.sourceType === 'JOURNAL') {
          return (
            <li key={key}>
              <Link
                href={`/journal?item=${source.sourceId}`}
                className="flex items-center justify-between gap-3 rounded-md border border-border-subtle bg-surface px-3 py-2 transition-colors duration-fast hover:bg-surface-raised"
              >
                {content}
              </Link>
            </li>
          );
        }
        if (source.sourceType === 'MEMORY') {
          return (
            <li key={key}>
              <Link
                href={`/memory?item=${source.sourceId}`}
                className="flex items-center justify-between gap-3 rounded-md border border-border-subtle bg-surface px-3 py-2 transition-colors duration-fast hover:bg-surface-raised"
              >
                {content}
              </Link>
            </li>
          );
        }
        return (
          <li key={key} className="flex items-center justify-between gap-3 rounded-md border border-border-subtle bg-surface px-3 py-2">
            {content}
          </li>
        );
      })}
    </ul>
  );
}
