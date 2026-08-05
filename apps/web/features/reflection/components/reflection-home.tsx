'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ReflectionFeed } from './reflection-feed';
import { ReflectionTimeline } from './reflection-timeline';
import { ReflectionGroups } from './reflection-groups';
import { ReflectionDetail } from './reflection-detail';

type Section = 'feed' | 'timeline' | 'groups';

const SECTIONS: { value: Section; label: string }[] = [
  { value: 'feed', label: 'Feed' },
  { value: 'timeline', label: 'Timeline' },
  { value: 'groups', label: 'Groups' },
];

/** `/reflections`'s top-level shell — the same "?item=<id> opens the detail view in place" plus
 * in-page section switcher pattern `MemoryView`/`JournalHome` already use. Reflection is
 * deliberately read-mostly: there is no "create" action anywhere in this UI, since candidates are
 * only ever generated deterministically from data the user already owns. */
export function ReflectionHome() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [section, setSection] = useState<Section>('feed');
  const activeId = searchParams.get('item');

  function selectItem(id: string | null) {
    router.replace(id ? `/reflections?item=${id}` : '/reflections', { scroll: false });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-heading-lg text-text-primary">Reflections</h1>
      </div>
      <p className="text-body-sm text-text-secondary">
        Patterns BeaconVie has noticed in your journal, memories, and goals — never AI-generated, never a guess at how you
        feel. Every reflection here traces back to something real you already wrote or saved, with the reason and the score
        always shown.
      </p>

      {!activeId && (
        <nav aria-label="Reflection sections" className="flex gap-2 border-b border-border-subtle pb-2">
          {SECTIONS.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setSection(s.value)}
              aria-current={section === s.value ? 'page' : undefined}
              className={`rounded-md px-3 py-1.5 text-body-sm font-medium transition-colors duration-fast ${
                section === s.value ? 'bg-surface text-text-primary' : 'text-text-secondary hover:bg-surface hover:text-text-primary'
              }`}
            >
              {s.label}
            </button>
          ))}
        </nav>
      )}

      {activeId ? (
        <ReflectionDetail id={activeId} onClose={() => selectItem(null)} />
      ) : (
        <>
          {section === 'feed' && <ReflectionFeed onSelect={selectItem} />}
          {section === 'timeline' && <ReflectionTimeline onSelect={selectItem} />}
          {section === 'groups' && <ReflectionGroups onSelect={selectItem} />}
        </>
      )}
    </div>
  );
}
