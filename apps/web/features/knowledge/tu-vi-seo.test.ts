import { starSourceContent, tuViPalaceSeo, tuViStarSeo } from './tu-vi-seo';
describe('Tử Vi SEO registry',()=>{
 it('covers exactly 12 canonical palaces',()=>{expect(tuViPalaceSeo).toHaveLength(12);expect(new Set(tuViPalaceSeo.map(x=>x.slug)).size).toBe(12);});
 it('derives the implemented 14 main stars plus CORE_13 auxiliary stars',()=>{expect(tuViStarSeo).toHaveLength(27);expect(new Set(tuViStarSeo.map(x=>x.slug)).size).toBe(27);});
 it('keeps public SEO labels Vietnamese',()=>{const text=[...tuViPalaceSeo.map(x=>x.description),...tuViStarSeo.map(x=>x.group)].join(' ');expect(text).toMatch(/[ăâđêôơưáàảãạéèẻẽẹíìỉĩịóòỏõọúùủũụýỳỷỹỵ]/i);expect(text).not.toMatch(/Life|Parents|Career|Wealth|Health|Friends|Travel|Siblings/i);});
 it('provides source-grounded, non-empty placement copy for every indexed star',()=>{
   const entries=tuViStarSeo.map(x=>starSourceContent(x.name));
   expect(entries).toHaveLength(27);
   expect(entries.every(x=>x.placement.length>40&&x.source.includes('VDTTL-1956'))).toBe(true);
   expect(new Set(entries.map(x=>`${x.placement}|${x.basis}|${x.relationship}`)).size).toBe(27);
   expect(entries.every(x=>x.basis.length>5&&x.relationship.length>20&&x.deepDiveSlug.length>5)).toBe(true);
   expect(starSourceContent('Tả Phù').placement).toContain('tháng âm lịch');
   expect(starSourceContent('Văn Xương').placement).toContain('giờ sinh');
   expect(starSourceContent('Kình Dương').placement).toContain('Lộc Tồn');
 });
});
