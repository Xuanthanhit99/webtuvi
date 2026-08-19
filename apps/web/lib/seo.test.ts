import { buildMetadata, buildWebsiteJsonLd, buildOrganizationJsonLd, SITE_NAME, SITE_URL, DEFAULT_DESCRIPTION } from './seo';

describe('buildMetadata', () => {
  it('builds indexable metadata with a canonical, OG, and Twitter block', () => {
    const meta = buildMetadata({ title: 'About', description: 'About BeaconVie.', path: '/about' });
    expect(meta.title).toBe('About');
    expect(meta.description).toBe('About BeaconVie.');
    expect(meta.alternates?.canonical).toBe('/about');
    expect(meta.openGraph?.title).toBe('About');
    expect(meta.openGraph?.description).toBe('About BeaconVie.');
    expect(meta.openGraph?.url).toBe('/about');
    // `Twitter` is a union of card-specific shapes; `card` only exists on some of them.
    // buildMetadata always sets 'summary_large_image', asserted via a targeted cast.
    expect((meta.twitter as { card?: string } | undefined)?.card).toBe('summary_large_image');
    expect(meta.robots).toBeUndefined();
  });

  it('falls back to the default description when none is given', () => {
    const meta = buildMetadata({ title: 'Home', path: '/' });
    expect(meta.description).toBe(DEFAULT_DESCRIPTION);
  });

  it('uses the site name as the OG/Twitter title when no title is given', () => {
    const meta = buildMetadata({ path: '/' });
    expect(meta.openGraph?.title).toBe(SITE_NAME);
    expect(meta.twitter?.title).toBe(SITE_NAME);
  });

  it('produces a noindex block with no canonical/OG/Twitter for private pages', () => {
    const meta = buildMetadata({ title: 'Dashboard', path: '/dashboard', noindex: true });
    expect(meta.robots).toEqual({ index: false, follow: false });
    expect(meta.alternates).toBeUndefined();
    expect(meta.openGraph).toBeUndefined();
    expect(meta.twitter).toBeUndefined();
  });

  it('treats the homepage path as canonical "/"', () => {
    const meta = buildMetadata({ path: '/' });
    expect(meta.alternates?.canonical).toBe('/');
  });
});

describe('structured data', () => {
  it('builds a WebSite JSON-LD object with only real, static fields', () => {
    const jsonLd = buildWebsiteJsonLd();
    expect(jsonLd['@context']).toBe('https://schema.org');
    expect(jsonLd['@type']).toBe('WebSite');
    expect(jsonLd.name).toBe(SITE_NAME);
    expect(jsonLd.url).toBe(SITE_URL);
    // Adversarial: no field on this object accepts arbitrary/user-controlled input in the first
    // place (the function takes no arguments), so there is no fabricated-content or
    // sensitive-data surface to test against beyond confirming the known-safe key set.
    expect(Object.keys(jsonLd).sort()).toEqual(['@context', '@type', 'description', 'name', 'url']);
  });

  it('builds an Organization JSON-LD object with only real, static fields', () => {
    const jsonLd = buildOrganizationJsonLd();
    expect(jsonLd['@type']).toBe('Organization');
    expect(jsonLd.name).toBe(SITE_NAME);
    expect(jsonLd.url).toBe(SITE_URL);
    expect(Object.keys(jsonLd).sort()).toEqual(['@context', '@type', 'name', 'url']);
  });

  it('never includes aggregateRating, review, or other fabricated-content fields', () => {
    const website = buildWebsiteJsonLd();
    const org = buildOrganizationJsonLd();
    for (const forbidden of ['aggregateRating', 'review', 'author', 'faqPage', 'award']) {
      expect(website).not.toHaveProperty(forbidden);
      expect(org).not.toHaveProperty(forbidden);
    }
  });
});
