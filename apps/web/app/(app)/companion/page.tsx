import type { Metadata } from 'next';
import { CompanionChat } from '@/features/companion/components/companion-chat';

export const metadata: Metadata = { title: 'Companion' };

export default function CompanionPage() {
  return <CompanionChat />;
}
