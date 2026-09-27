import { tuViPalaceSeo, tuViStarSeo } from './tu-vi-seo';
describe('Tử Vi SEO registry',()=>{
 it('covers exactly 12 canonical palaces',()=>{expect(tuViPalaceSeo).toHaveLength(12);expect(new Set(tuViPalaceSeo.map(x=>x.slug)).size).toBe(12);});
 it('derives the implemented 14 main stars plus CORE_13 auxiliary stars',()=>{expect(tuViStarSeo).toHaveLength(27);expect(new Set(tuViStarSeo.map(x=>x.slug)).size).toBe(27);});
 it('keeps public SEO labels Vietnamese',()=>{const text=[...tuViPalaceSeo.map(x=>x.description),...tuViStarSeo.map(x=>x.group)].join(' ');expect(text).toMatch(/[ăâđêôơưáàảãạéèẻẽẹíìỉĩịóòỏõọúùủũụýỳỷỹỵ]/i);expect(text).not.toMatch(/Life|Parents|Career|Wealth|Health|Friends|Travel|Siblings/i);});
});
