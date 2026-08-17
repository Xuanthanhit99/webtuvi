import type { Metadata } from 'next';
import { AnalyticsPageView } from '@/components/analytics/analytics-page-view';
import { OnboardingChat } from '@/features/onboarding/components/onboarding-chat';

export const metadata: Metadata = { title: 'Getting to know you' };

export default function OnboardingPage() {
  return (
    <div id="main-content" className="min-h-dvh bg-canvas">
      <AnalyticsPageView event="onboarding_started" properties={{ feature: 'onboarding' }} />
      <OnboardingChat />
    </div>
  );
}
