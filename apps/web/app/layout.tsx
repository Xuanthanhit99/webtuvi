import type { Metadata } from 'next';
import Script from 'next/script';
import { Playfair_Display, Be_Vietnam_Pro, IBM_Plex_Mono } from 'next/font/google';
import { QueryProvider } from '@/providers/query-provider';
import { AuthProvider } from '@/providers/auth-provider';
import { AuthModalProvider } from '@/providers/auth-modal-provider';
import { Toaster } from '@/components/ui/toast';
import { GoogleMeasurement } from '@/components/analytics/google-measurement';
import { SITE_NAME, SITE_URL, DEFAULT_DESCRIPTION, isIndexingEnabled } from '@/lib/seo';
import '@/styles/globals.css';

const displayFont = Playfair_Display({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-fraunces',
  display: 'swap',
});

const bodyFont = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600'],
  variable: '--font-karla',
  display: 'swap',
});

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
  preload: false,
});

const GOOGLE_CONSENT_DEFAULT = `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('consent', 'default', {
  analytics_storage: 'denied',
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  wait_for_update: 500
});`;

const TAGLINE = `${SITE_NAME} — Tử Vi, Tarot, Bản đồ sao và Thần số học`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  robots: { index: isIndexingEnabled(), follow: true },
  title: {
    default: TAGLINE,
    template: `%s — ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  openGraph: {
    title: TAGLINE,
    description: DEFAULT_DESCRIPTION,
    type: 'website',
    url: '/',
    siteName: SITE_NAME,
    images: [{ url: '/assets/menh-vi-home-production-webp/backgrounds/hero-home.webp', width: 1896, height: 830, alt: 'Mệnh Vi — Tử Vi, Tarot, Bản đồ sao và Thần số học' }],
    locale: 'vi_VN',
  },
  twitter: {
    card: 'summary_large_image',
    title: TAGLINE,
    description: DEFAULT_DESCRIPTION,
    images: ['/assets/menh-vi-home-production-webp/backgrounds/hero-home.webp'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${displayFont.variable} ${bodyFont.variable} ${mono.variable}`}>
      <body>
        <Script id="google-consent-default" strategy="beforeInteractive">
          {GOOGLE_CONSENT_DEFAULT}
        </Script>
        <a href="#main-content" className="skip-link">
          Bỏ qua điều hướng và đến nội dung chính
        </a>
        <GoogleMeasurement />
        <QueryProvider>
          <AuthProvider>
            <AuthModalProvider>
              {children}
            </AuthModalProvider>
            <Toaster />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
