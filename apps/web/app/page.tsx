import type { Metadata } from 'next';
import { HomeRoute } from '@/features/dashboard/components/home-route';
import { AnalyticsPageView } from '@/components/analytics/analytics-page-view';
import { buildMetadata, buildOrganizationJsonLd, buildWebsiteJsonLd } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Tử Vi Tarot — Tử Vi, Tarot, Bản Đồ Sao & Thần Số Học',
  description: 'Tử Vi Tarot giúp bạn khám phá Tử Vi, Tarot, bản đồ sao và thần số học trong một trải nghiệm hiện đại, riêng tư và dễ bắt đầu.',
  path: '/',
});

export default function HomePage() {
  const websiteJsonLd = buildWebsiteJsonLd();
  const organizationJsonLd = buildOrganizationJsonLd();

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
      <AnalyticsPageView event="home_viewed" properties={{ feature: 'home' }} />
      <HomeRoute />
    </>
  );
}
