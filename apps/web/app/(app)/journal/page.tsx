import type { Metadata } from 'next';
import { EmptyState } from '@/components/ui/empty-state';

export const metadata: Metadata = { title: 'Journal' };

export default function JournalPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-heading-lg text-text-primary">Journal</h1>
      <EmptyState
        title="Journal is coming soon"
        description="A private, freeform space to write is on its way. Your Companion conversations already remember what matters, in the meantime."
      />
    </div>
  );
}
