import type { Metadata } from 'next';
import { JournalNew } from '@/features/journal/components/journal-new';

export const metadata: Metadata = { title: 'New entry — Journal' };

export default function JournalNewPage() {
  return <JournalNew />;
}
