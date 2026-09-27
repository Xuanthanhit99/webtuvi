import sitemap from './sitemap';

describe('Content SEO sitemap', () => {
  const previous = process.env.NEXT_PUBLIC_SITE_INDEXABLE;
  beforeEach(() => { process.env.NEXT_PUBLIC_SITE_INDEXABLE = 'true'; process.env.NEXT_PUBLIC_APP_URL = 'https://tuvitarot.vn'; });
  afterAll(() => { process.env.NEXT_PUBLIC_SITE_INDEXABLE = previous; });
  it('includes knowledge content, all 78 Tarot cards and canonical Tử Vi palace/star pages', () => {
    const urls = sitemap().map((item) => item.url);
    expect(urls).toContain('https://tuvitarot.vn/kien-thuc');
    expect(urls.filter((url) => url.includes('/kien-thuc/'))).toHaveLength(135);
    expect(urls).toContain('https://tuvitarot.vn/kien-thuc/than-so-hoc/so-chu-dao-11');
    expect(urls).toContain('https://tuvitarot.vn/kien-thuc/tarot/y-nghia-78-la-tarot');
    for (const slug of ['cach-an-14-chinh-tinh', 'cach-an-phu-tinh-core-13', 'tu-hoa-trong-bo-quy-tac']) expect(urls).toContain(`https://tuvitarot.vn/kien-thuc/tu-vi/${slug}`);
    const tarotCards = urls.filter((url) => url.includes('/kien-thuc/tarot/la-bai/'));
    expect(tarotCards).toHaveLength(78);
    expect(new Set(tarotCards).size).toBe(78);
    const tuViPalaces = urls.filter((url) => url.includes('/kien-thuc/tu-vi/cung/'));
    const tuViStars = urls.filter((url) => url.includes('/kien-thuc/tu-vi/sao/'));
    expect(tuViPalaces).toHaveLength(12);
    expect(tuViStars).toHaveLength(27);
    expect(new Set(tuViPalaces).size).toBe(12);
    expect(new Set(tuViStars).size).toBe(27);
    expect(tuViPalaces).toContain('https://tuvitarot.vn/kien-thuc/tu-vi/cung/menh');
    expect(tuViStars).toContain('https://tuvitarot.vn/kien-thuc/tu-vi/sao/tu-vi');
    expect(tarotCards).toContain('https://tuvitarot.vn/kien-thuc/tarot/la-bai/major-00-the-fool');
    expect(tarotCards).toContain('https://tuvitarot.vn/kien-thuc/tarot/la-bai/pentacles-14-king-of-pentacles');
  });
});
