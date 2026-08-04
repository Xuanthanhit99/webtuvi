'use client';

import { useRouter } from 'next/navigation';
import { JournalDetail } from './journal-detail';

export function JournalEntryPage({ id }: { id: string }) {
  const router = useRouter();
  return <JournalDetail id={id} onClose={() => router.push('/journal')} />;
}
