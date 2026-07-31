import type { Metadata } from 'next';
import { OnboardingChat } from '@/features/onboarding/components/onboarding-chat';

export const metadata: Metadata = { title: 'Getting to know you' };

export default function OnboardingPage() {
  return (
    <div id="main-content" className="min-h-dvh bg-canvas">
      <OnboardingChat />
    </div>
  );
}
