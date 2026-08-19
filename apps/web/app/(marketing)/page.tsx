import type { Metadata } from 'next';
import { AnalyticsPageView } from '@/components/analytics/analytics-page-view';
import { Hero } from '@/components/marketing/hero';
import { TrustSection } from '@/components/marketing/trust-section';
import { ProblemSolution } from '@/components/marketing/problem-solution';
import { HowItWorks } from '@/components/marketing/how-it-works';
import { DiscoverySystems } from '@/components/marketing/discovery-systems';
import { CompanionPreview } from '@/components/marketing/companion-preview';
import { MemorySection } from '@/components/marketing/memory-section';
import { PrivacySection } from '@/components/marketing/privacy-section';
import { Testimonials } from '@/components/marketing/testimonials';
import { PricingSection } from '@/components/marketing/pricing-section';
import { FaqSection } from '@/components/marketing/faq-section';
import { FinalCta } from '@/components/marketing/final-cta';
import { buildMetadata, buildWebsiteJsonLd, buildOrganizationJsonLd } from '@/lib/seo';

// SEO + Shareability Foundation — explicit canonical for `/`, rather than relying solely on the
// root layout's global metadata (which every unoverridden route inherits identically — see the
// final report's §10/§11 for why an explicit canonical here matters even though the title/
// description already happened to be homepage-appropriate).
export const metadata: Metadata = buildMetadata({ path: '/' });

export default function LandingPage() {
  const websiteJsonLd = buildWebsiteJsonLd();
  const organizationJsonLd = buildOrganizationJsonLd();

  return (
    <>
      {/* JSON-LD requires raw script injection; the payload is built entirely from static,
          non-user-controlled constants in lib/seo.ts, never from request data — no injection
          surface here. */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
      <AnalyticsPageView event="landing_view" />
      <Hero />
      <TrustSection />
      <ProblemSolution />
      <HowItWorks />
      <DiscoverySystems />
      <CompanionPreview />
      <MemorySection />
      <PrivacySection />
      <Testimonials />
      <PricingSection />
      <FaqSection />
      <FinalCta />
    </>
  );
}
