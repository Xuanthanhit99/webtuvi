import type { Metadata } from 'next';
import { Playfair_Display, Be_Vietnam_Pro, IBM_Plex_Mono } from 'next/font/google';
import { QueryProvider } from '@/providers/query-provider';
import { AuthProvider } from '@/providers/auth-provider';
import { Toaster } from '@/components/ui/toast';
import { SITE_NAME, DEFAULT_DESCRIPTION } from '@/lib/seo';
import '@/styles/globals.css';

// Module 4 §16 specifies Fraunces/Karla, but neither ships a Vietnamese subset on
// Google Fonts (confirmed at build time — Fraunces only offers latin/latin-ext).
// Sprint 1's Vietnamese-support requirement is a hard technical constraint, so
// these are substituted with typographically similar families that do carry a
// "vietnamese" subset: Playfair Display (warm editorial serif, in the Companion-
// voice/heading role Fraunces would have held) and Be Vietnam Pro (a humanist
// grotesque sans purpose-built for Vietnamese, in Karla's body/UI role). See
// docs/architecture/sprint-1-decisions.md.
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

// Mono is used only for numerals/timestamps (Module 4 §16 scope), never Vietnamese
// prose, so it doesn't need the vietnamese subset.
const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
});

const TAGLINE = `${SITE_NAME} — Tử Vi, Tarot, Bản đồ sao và Thần số học`;

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  title: {
    default: TAGLINE,
    template: `%s — ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  openGraph: {
    title: TAGLINE,
    description: DEFAULT_DESCRIPTION,
    type: 'website',
    locale: 'vi_VN',
  },
  twitter: {
    card: 'summary_large_image',
    title: TAGLINE,
    description: DEFAULT_DESCRIPTION,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${displayFont.variable} ${bodyFont.variable} ${mono.variable}`}>
      <body>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <QueryProvider>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
