'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { MemoryTimeline } from './memory-timeline';
import { MemoryDetail } from './memory-detail';
import { CandidateReview } from './candidate-review';
import { ConsentSettings } from './consent-settings';
import { RecommendationPanel } from './recommendation-panel';
import { ConflictsSection } from './conflicts-section';
import { DuplicatesSection } from './duplicates-section';
import { MergeSuggestionsPanel } from './merge-suggestions-panel';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { memoryApi } from '../api/memory-api';
import { MvPage, MvPageHeader } from '@/components/ui/mv-page';

type Section = 'timeline' | 'candidates' | 'insights' | 'consent';

const SECTIONS: { value: Section; label: string }[] = [
  { value: 'timeline', label: 'Timeline' },
  { value: 'candidates', label: 'Pending' },
  { value: 'insights', label: 'Insights' },
  { value: 'consent', label: 'Memory settings' },
];

export function MemoryView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [section, setSection] = useState<Section>('timeline');
  const activeId = searchParams.get('item');

  const createExport = useMutation({
    mutationFn: () => memoryApi.export.create(),
    onSuccess: (job) => {
      const blob = new Blob([JSON.stringify(job.result, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `beaconvie-memory-export-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Your memory export has downloaded.');
    },
    onError: () => toast.error("Couldn't create an export right now. Please try again."),
  });

  function selectItem(id: string | null) {
    router.replace(id ? `/memory?item=${id}` : '/memory', { scroll: false });
  }

  return (
    <MvPage>
      <div className="flex items-center justify-between gap-3">
        <MvPageHeader
          eyebrow="Memory"
          title="Những điều Tử Vi Tarot đang giữ lại cho bạn"
          description="Everything Tử Vi Tarot remembers about you, with the source, the reason, and your consent choice always visible. Nothing here is guessed — every memory traces back to something you actually said or explicitly asked Tử Vi Tarot to remember."
          className="mb-0"
        />
        <Button variant="secondary" size="sm" onClick={() => createExport.mutate()} loading={createExport.isPending}>
          Export my memories
        </Button>
      </div>

      <nav aria-label="Memory sections" className="flex gap-2 border-b border-border-subtle pb-2">
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

      {activeId ? (
        <MemoryDetail memoryId={activeId} onClose={() => selectItem(null)} />
      ) : (
        <>
          {section === 'timeline' && <MemoryTimeline onSelect={selectItem} />}
          {section === 'candidates' && <CandidateReview />}
          {section === 'insights' && (
            <div className="flex flex-col gap-8">
              <section aria-labelledby="insights-recommendations">
                <h2 id="insights-recommendations" className="mb-3 text-body-sm font-semibold text-text-secondary">
                  Recommended for you
                </h2>
                <RecommendationPanel />
              </section>
              <section aria-labelledby="insights-merge-suggestions">
                <h2 id="insights-merge-suggestions" className="mb-3 text-body-sm font-semibold text-text-secondary">
                  Merge suggestions
                </h2>
                <MergeSuggestionsPanel />
              </section>
              <section aria-labelledby="insights-duplicates">
                <h2 id="insights-duplicates" className="mb-3 text-body-sm font-semibold text-text-secondary">
                  Duplicates
                </h2>
                <DuplicatesSection />
              </section>
              <section aria-labelledby="insights-conflicts">
                <h2 id="insights-conflicts" className="mb-3 text-body-sm font-semibold text-text-secondary">
                  Conflicts
                </h2>
                <ConflictsSection />
              </section>
            </div>
          )}
          {section === 'consent' && <ConsentSettings />}
        </>
      )}
    </MvPage>
  );
}
