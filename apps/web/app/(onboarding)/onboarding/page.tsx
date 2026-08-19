import type { Metadata } from 'next';
import { AnalyticsPageView } from '@/components/analytics/analytics-page-view';
import { OnboardingChat } from '@/features/onboarding/components/onboarding-chat';

// SEO + Shareability Foundation — authenticated-only route with no group layout to centralize
// this in (unlike (app)/layout.tsx); set directly, matching the same defense-in-depth pattern.
export const metadata: Metadata = { title: 'Getting to know you', robots: { index: false, follow: false } };

export default function OnboardingPage() {
  return (
    <div id="main-content" className="min-h-dvh bg-canvas">
      <AnalyticsPageView event="onboarding_started" properties={{ feature: 'onboarding' }} />
      <OnboardingChat />
    </div>
  );
}
