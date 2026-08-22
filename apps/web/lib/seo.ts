import type { Metadata } from 'next';

/**
 * SEO + Shareability Foundation — single source of truth for site-wide identity and per-page
 * metadata construction. No page should hardcode the site name, base URL, or repeat the
 * canonical-URL-building logic — call `buildMetadata()` instead. See
 * docs/progress/seo-shareability-foundation-final-report.md for the audit this came out of.
 *
 * There is deliberately no `images`/OG-image entry here: no dedicated social-preview asset exists
 * anywhere in this repo (no favicon, no logo, no OG artwork — verified, not assumed). Fabricating
 * one is explicitly out of scope for this pass; social platforms fall back to a plain link card
 * without one. Documented as a design follow-up, not silently worked around.
 */

// Domain + Brand Production Lock (superseding founder decision — see
// docs/progress/domain-brand-production-lock-final-report.md and product-completion-roadmap-v2.md's
// appended superseding-decision note): brand renamed from BeaconVie to Tử Vi Tarot, production
// domain tuvitarot.vn. This is the single point every other metadata/copy/JSON-LD/share call in
// this app derives from — no other file should hardcode either name.
export const SITE_NAME = 'Tử Vi Tarot';

/** Matches the env var every other metadata/canonical call in this app already reads
 * (`app/layout.tsx`, `robots.ts`, `sitemap.ts`) — reusing it here, not introducing a second name. */
export const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export const DEFAULT_DESCRIPTION =
  'Tử Vi Tarot giúp bạn khám phá Tử Vi, Tarot, bản đồ sao và thần số học trong một trải nghiệm hiện đại, riêng tư và dễ bắt đầu.';

export interface BuildMetadataOptions {
  /** Page-specific title. Combined with the root layout's `%s — Tử Vi Tarot` template
   * automatically by Next.js — do not append the site name here yourself. */
  title?: string;
  description?: string;
  /** Site-relative path this page is canonically reachable at, e.g. `/about` or `/`. Required
   * whenever the page is meant to be indexable, so `alternates.canonical` is always explicit
   * rather than left for Next.js to infer from the request URL (which would let query strings or
   * trailing-slash variants create duplicate-content canonicals). */
  path: string;
  /** `false` (default) for genuinely public, indexable pages. `true` marks a page noindex,follow
   * at the metadata level — the defense-in-depth layer described in the final report's §6
   * (never rely on robots.txt alone for a private/sensitive page). */
  noindex?: boolean;
}

/**
 * Builds a `Metadata` object with a correct canonical URL and, for indexable pages, OpenGraph +
 * Twitter metadata derived from the same title/description (no separate copy to keep in sync).
 * Noindex pages intentionally omit OG/Twitter — there's nothing to make shareable about a page
 * that must never be indexed or linked to publicly.
 */
export function buildMetadata({ title, description = DEFAULT_DESCRIPTION, path, noindex = false }: BuildMetadataOptions): Metadata {
  const canonical = path === '/' ? '/' : path;
  const resolvedTitle = title ?? SITE_NAME;
  // Next.js merges a route's metadata into its parent layout's shallowly, key by key. A `title`
  // key that is *present* but `undefined` still overwrites the parent's inherited title (it
  // isn't treated as "unset") — so this key must be omitted entirely, not just left undefined,
  // whenever no page-specific title was given. Omitting it lets the root layout's
  // `title.default`/`template` apply, which is what every caller that doesn't pass `title`
  // (currently just the homepage) actually wants.
  const titleField = title !== undefined ? { title } : {};

  if (noindex) {
    return {
      ...titleField,
      robots: { index: false, follow: false },
    };
  }

  return {
    ...titleField,
    description,
    alternates: { canonical },
    openGraph: {
      title: resolvedTitle,
      description,
      url: canonical,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: resolvedTitle,
      description,
    },
  };
}

/** JSON-LD for the homepage only — `WebSite` + `Organization`. Every field is a real, already-true
 * fact about the product (name, url, description) — no aggregateRating/review/author/FAQ content,
 * none of which would be genuine. See the final report's §7 for why this is the only page that
 * gets structured data in this pass (every other candidate page is either private/noindex or
 * doesn't yet have a public entry point to describe — see the Stop-Condition-H finding). */
export function buildWebsiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description: DEFAULT_DESCRIPTION,
  };
}

export function buildOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
  };
}
