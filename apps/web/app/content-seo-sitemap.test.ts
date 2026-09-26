import sitemap from './sitemap';

describe('Content SEO sitemap', () => {
  const previous = process.env.NEXT_PUBLIC_SITE_INDEXABLE;
  beforeEach(() => { process.env.NEXT_PUBLIC_SITE_INDEXABLE = 'true'; process.env.NEXT_PUBLIC_APP_URL = 'https://tuvitarot.vn'; });
  afterAll(() => { process.env.NEXT_PUBLIC_SITE_INDEXABLE = previous; });
  it('includes the knowledge hub, all five clusters and ten launch articles', () => {
    const urls = sitemap().map((item) => item.url);
    expect(urls).toContain('https://tuvitarot.vn/kien-thuc');
    expect(urls.filter((url) => url.includes('/kien-thuc/'))).toHaveLength(15);
    expect(urls).toContain('https://tuvitarot.vn/kien-thuc/than-so-hoc/so-chu-dao-11');
    expect(urls).toContain('https://tuvitarot.vn/kien-thuc/tarot/y-nghia-78-la-tarot');
  });
});
