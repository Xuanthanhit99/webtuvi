import { tarotCardDescription, tarotCardTitle, tarotSeoCards, tarotSeoVi } from './tarot-cards';

describe('Tarot programmatic SEO V2 quality gate', () => {
  it('covers exactly 78 unique canonical cards', () => {
    expect(tarotSeoCards).toHaveLength(78);
    expect(new Set(tarotSeoCards.map((card) => card.slug)).size).toBe(78);
  });

  it('provides substantive Vietnamese editorial content for every card', () => {
    for (const card of tarotSeoCards) {
      const vi = tarotSeoVi(card);
      expect(vi.uprightMeaning.length).toBeGreaterThan(180);
      expect(vi.reversedMeaning.length).toBeGreaterThan(180);
      expect(vi.loveMeaning.length).toBeGreaterThan(140);
      expect(vi.careerMeaning.length).toBeGreaterThan(120);
      expect(vi.financeMeaning.length).toBeGreaterThan(160);
      expect(vi.selfMeaning.length).toBeGreaterThan(130);
      expect(vi.reflectionPrompts.length).toBeGreaterThanOrEqual(3);
      expect(vi.uprightKeywords.length).toBeGreaterThanOrEqual(3);
      expect(vi.reversedKeywords.length).toBeGreaterThanOrEqual(3);
      const prose = [vi.uprightMeaning, vi.reversedMeaning, vi.loveMeaning, vi.careerMeaning, vi.financeMeaning, vi.selfMeaning, ...vi.reflectionPrompts].join(' ');
      expect(prose).toMatch(/[ăâđêôơưáàảãạéèẻẽẹíìỉĩịóòỏõọúùủũụýỳỷỹỵ]/i);
    }
  });

  it('keeps titles, descriptions and main meanings unique', () => {
    const titles = tarotSeoCards.map(tarotCardTitle);
    const descriptions = tarotSeoCards.map(tarotCardDescription);
    const upright = tarotSeoCards.map((card) => tarotSeoVi(card).uprightMeaning);
    const reversed = tarotSeoCards.map((card) => tarotSeoVi(card).reversedMeaning);
    expect(new Set(titles).size).toBe(78);
    expect(new Set(descriptions).size).toBe(78);
    expect(new Set(upright).size).toBe(78);
    expect(new Set(reversed).size).toBe(78);
  });

  it('does not expose untranslated keyword fallback markers', () => {
    for (const card of tarotSeoCards) {
      const vi = tarotSeoVi(card);
      expect([...vi.uprightKeywords, ...vi.reversedKeywords].join(' ')).not.toMatch(/(?:chủ đề|mặt cần xem lại): [a-z]/i);
    }
  });
});
