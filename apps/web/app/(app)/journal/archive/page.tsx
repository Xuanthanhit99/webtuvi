import type { Metadata } from 'next';
import { JournalArchive } from '@/features/journal/components/journal-archive';

export const metadata: Metadata = { title: 'Archive — Journal' };

export default function JournalArchivePage() {
  return <JournalArchive />;
}
