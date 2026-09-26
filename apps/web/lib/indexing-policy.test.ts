import { buildMetadata, isIndexingEnabled, SITE_URL } from './seo';
import robots from '@/app/robots';
import sitemap from '@/app/sitemap';
import { PUBLIC_DISCOVERY_ROUTES } from './route-guard';

const original = { app: process.env.NEXT_PUBLIC_APP_URL, indexing: process.env.NEXT_PUBLIC_SITE_INDEXABLE };
afterEach(() => {
  for (const [key, value] of Object.entries({ NEXT_PUBLIC_APP_URL: original.app, NEXT_PUBLIC_SITE_INDEXABLE: original.indexing })) {
    if (value === undefined) delete process.env[key]; else process.env[key] = value;
  }
});
it.each(['http://localhost:3000', 'https://preview.example.com', 'https://www.tuvitarot.vn'])('blocks indexing for %s without changing the canonical domain', (host) => {
  process.env.NEXT_PUBLIC_APP_URL = host;
  expect(SITE_URL).toBe('https://tuvitarot.vn');
  expect(isIndexingEnabled()).toBe(false);
  expect(robots().rules).toEqual({ userAgent: '*', disallow: '/' });
  expect(sitemap()).toEqual([]);
  expect(buildMetadata({ path: '/discover' }).robots).toEqual({ index: false, follow: true });
});
it('supports an explicit deployment noindex switch', () => {
  process.env.NEXT_PUBLIC_APP_URL = SITE_URL;
  process.env.NEXT_PUBLIC_SITE_INDEXABLE = 'false';
  expect(isIndexingEnabled()).toBe(false);
});
it('publishes only canonical, public URLs with stable modification metadata', () => {
  process.env.NEXT_PUBLIC_APP_URL = SITE_URL;
  delete process.env.NEXT_PUBLIC_SITE_INDEXABLE;
  const entries = sitemap();
  for (const route of PUBLIC_DISCOVERY_ROUTES) expect(entries.map((entry) => entry.url)).toContain(`${SITE_URL}${route}`);
  expect(entries.every((entry) => !entry.lastModified && !entry.url.includes('?'))).toBe(true);
  expect(JSON.stringify(robots().rules)).not.toContain('"/discover"');
});
it('keeps auth forms out of the index and gives Home a branded absolute title', async () => {
  const [{ metadata: login }, { metadata: register }, { metadata: home }] = await Promise.all([
    import('@/app/(auth)/login/page'),
    import('@/app/(auth)/register/page'),
    import('@/app/page'),
  ]);
  for (const meta of [login, register]) {
    expect(meta.robots).toEqual({ index: false, follow: false });
    expect(meta.alternates?.canonical).toBeNull();
  }
  expect(home.title).toEqual({ absolute: expect.stringMatching(/^Mệnh Vi — /) });
  expect(home.openGraph?.title).toBe((home.title as { absolute: string }).absolute);
});
