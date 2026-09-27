import { articlesByCluster } from './content';

describe('Tử Vi knowledge cluster V2', () => {
  const articles = articlesByCluster('tu-vi');

  it('contains a complete foundation → placement → Tứ Hóa learning path', () => {
    expect(articles.map((article) => article.slug)).toEqual(expect.arrayContaining([
      'la-so-tu-vi-la-gi',
      'cach-xem-la-so-tu-vi',
      'cach-an-14-chinh-tinh',
      'cach-an-phu-tinh-core-13',
      'tu-hoa-trong-bo-quy-tac',
    ]));
  });

  it('keeps source-boundary language in the placement deep dives', () => {
    const main = articles.find((article) => article.slug === 'cach-an-14-chinh-tinh')!;
    const auxiliary = articles.find((article) => article.slug === 'cach-an-phu-tinh-core-13')!;
    const combined = [...main.sections, ...auxiliary.sections].map((section) => section.body).join(' ');
    expect(combined).toContain('VDTTL-1956');
    expect(combined).toContain('không đủ');
    expect(combined).toContain('cần tái kiểm tra');
  });

  it('links every Tử Vi deep dive back into the tool and neighboring articles', () => {
    for (const article of articles) {
      expect(article.cta.href).toBe('/discover/tu-vi');
      expect(article.relatedSlugs?.length ?? 0).toBeGreaterThan(0);
    }
  });
});
