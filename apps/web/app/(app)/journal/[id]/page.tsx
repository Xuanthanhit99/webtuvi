import type { Metadata } from 'next';
import { JournalEntryPage } from '@/features/journal/components/journal-entry-page';

export const metadata: Metadata = { title: 'Journal entry' };

export default async function JournalIdPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <JournalEntryPage id={id} />;
}
