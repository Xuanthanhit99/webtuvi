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

export default function LandingPage() {
  return (
    <>
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
