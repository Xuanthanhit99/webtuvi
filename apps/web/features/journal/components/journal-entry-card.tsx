'use client';

import type { JournalEntryDto } from '@beaconvie/types';
import { Badge } from '@/components/ui/badge';

const MOOD_LABELS: Record<string, string> = {
  GREAT: 'Great',
  GOOD: 'Good',
  OKAY: 'Okay',
  LOW: 'Low',
  DIFFICULT: 'Difficult',
};

function excerptOf(content: string): string {
  const trimmed = content.trim();
  return trimmed.length <= 160 ? trimmed : `${trimmed.slice(0, 160)}…`;
}

export function JournalEntryCard({ entry, onSelect }: { entry: JournalEntryDto; onSelect: (id: string) => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(entry.id)}
        className="flex w-full flex-col gap-1.5 rounded-md border border-border-subtle bg-surface p-4 text-left transition-colors duration-fast hover:bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-insight"
      >
        <div className="flex flex-wrap items-center gap-2">
          {entry.pinned && <Badge variant="new">Pinned</Badge>}
          {entry.state === 'DRAFT' && <Badge variant="neutral">Draft</Badge>}
          {entry.state === 'ARCHIVED' && <Badge variant="neutral">Archived</Badge>}
          {entry.mood && <Badge variant="insight">{MOOD_LABELS[entry.mood]}</Badge>}
          {entry.tags.map((tag) => (
            <Badge key={tag} variant="neutral">
              {tag}
            </Badge>
          ))}
        </div>
        <p className="font-display text-heading-sm text-text-primary">{entry.title || 'Untitled entry'}</p>
        {entry.content && <p className="text-body-sm text-text-secondary">{excerptOf(entry.content)}</p>}
        <p className="text-caption text-text-tertiary">
          {new Date(entry.createdAt).toLocaleDateString()} · {entry.wordCount} {entry.wordCount === 1 ? 'word' : 'words'} · {entry.readingTimeMinutes} min
          read
        </p>
      </button>
    </li>
  );
}
