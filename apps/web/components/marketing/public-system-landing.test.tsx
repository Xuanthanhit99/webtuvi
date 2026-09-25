import { render } from '@testing-library/react';
import { PublicSystemLanding } from './public-system-landing';

function jsonLdOf(container: HTMLElement) {
  return Array.from(container.querySelectorAll('script[type="application/ld+json"]')).map((node) => JSON.parse(node.textContent ?? ''));
}

describe('PublicSystemLanding structured data', () => {
  it('describes the page and mirrors the visible breadcrumb with absolute production URLs', () => {
    const { container } = render(<PublicSystemLanding slug="tarot" />);
    const [webPage, breadcrumb] = jsonLdOf(container);

    expect(webPage).toMatchObject({ '@type': 'WebPage', url: 'https://tuvitarot.vn/discover/tarot' });
    expect(breadcrumb['@type']).toBe('BreadcrumbList');
    expect(breadcrumb.itemListElement.map((item: { name: string; item: string }) => [item.name, item.item])).toEqual([
      ['Trang chủ', 'https://tuvitarot.vn'],
      ['Khám phá', 'https://tuvitarot.vn/discover'],
      ['Tarot 78 Lá', 'https://tuvitarot.vn/discover/tarot'],
    ]);

    const visibleCrumbs = container.querySelector('nav[aria-label="Đường dẫn"]')?.textContent;
    expect(visibleCrumbs).toBe('Trang chủ/Khám phá/Tarot 78 Lá');
  });

  it('never emits fabricated review, rating or FAQ schema', () => {
    const { container } = render(<PublicSystemLanding slug="tu-vi" />);
    const serialized = JSON.stringify(jsonLdOf(container));
    expect(serialized).not.toMatch(/Review|AggregateRating|FAQPage|Person/);
  });
});
