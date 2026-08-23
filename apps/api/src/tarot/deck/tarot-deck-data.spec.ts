import { TAROT_DECK, TAROT_DECK_VERSION } from '../../../prisma/data/tarot-deck';

/** Tarot 78-Card Completion — the canonical deck-completeness matrix (master brief §41 "DECK").
 * Imports the real seed data directly (never re-typed) so this test fails immediately if the
 * deck's own runtime assertions (thrown at module load, see tarot-deck.ts) were ever weakened. */
describe('TAROT_DECK completeness', () => {
  it('contains exactly 78 cards', () => {
    expect(TAROT_DECK).toHaveLength(78);
  });

  it('contains exactly 22 Major Arcana', () => {
    expect(TAROT_DECK.filter((c) => c.arcana === 'MAJOR')).toHaveLength(22);
  });

  it.each(['WANDS', 'CUPS', 'SWORDS', 'PENTACLES'] as const)('contains exactly 14 %s cards', (suit) => {
    expect(TAROT_DECK.filter((c) => c.suit === suit)).toHaveLength(14);
  });

  it('has 56 Minor Arcana total', () => {
    expect(TAROT_DECK.filter((c) => c.arcana === 'MINOR')).toHaveLength(56);
  });

  it('has unique slugs', () => {
    expect(new Set(TAROT_DECK.map((c) => c.slug)).size).toBe(78);
  });

  it('has unique imageSlugs', () => {
    expect(new Set(TAROT_DECK.map((c) => c.imageSlug)).size).toBe(78);
  });

  it('every card has a non-empty English name and Vietnamese name', () => {
    for (const card of TAROT_DECK) {
      expect(card.name.trim().length).toBeGreaterThan(0);
      expect(card.nameVi.trim().length).toBeGreaterThan(0);
    }
  });

  it('every card has non-empty upright and reversed content (reversals fully supported)', () => {
    for (const card of TAROT_DECK) {
      expect(card.uprightMeaning.trim().length).toBeGreaterThan(0);
      expect(card.reversedMeaning.trim().length).toBeGreaterThan(0);
      expect(card.uprightKeywords.length).toBeGreaterThanOrEqual(3);
      expect(card.reversedKeywords.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('every card has 2-4 reflection prompts, each phrased as a real question', () => {
    for (const card of TAROT_DECK) {
      expect(card.reflectionPrompts.length).toBeGreaterThanOrEqual(2);
      expect(card.reflectionPrompts.length).toBeLessThanOrEqual(4);
      for (const prompt of card.reflectionPrompts) {
        expect(prompt.trim().endsWith('?')).toBe(true);
      }
    }
  });

  it('every card has all four topic-framed meanings (love/career/finance/self)', () => {
    for (const card of TAROT_DECK) {
      expect(card.loveMeaning.trim().length).toBeGreaterThan(0);
      expect(card.careerMeaning.trim().length).toBeGreaterThan(0);
      expect(card.financeMeaning.trim().length).toBeGreaterThan(0);
      expect(card.selfMeaning.trim().length).toBeGreaterThan(0);
    }
  });

  it('never states a deterministic guaranteed outcome in any meaning field', () => {
    const bannedPhrases = ['you will definitely', 'this guarantees', 'guaranteed to', 'will definitely happen', 'this proves'];
    for (const card of TAROT_DECK) {
      const allText = [
        card.uprightMeaning,
        card.reversedMeaning,
        card.loveMeaning,
        card.careerMeaning,
        card.financeMeaning,
        card.selfMeaning,
        ...card.reflectionPrompts,
      ]
        .join(' ')
        .toLowerCase();
      for (const phrase of bannedPhrases) {
        expect(allText).not.toContain(phrase);
      }
    }
  });

  it('stamps every card with the current deck version', () => {
    for (const card of TAROT_DECK) {
      expect(card.deckVersion).toBe(TAROT_DECK_VERSION);
    }
  });

  it('Minor Arcana Vietnamese names are consistently derived (no mixed suit terminology)', () => {
    const cupsCards = TAROT_DECK.filter((c) => c.suit === 'CUPS');
    const suitTermsUsed = new Set(cupsCards.map((c) => c.nameVi.split(' ').pop()));
    expect(suitTermsUsed.size).toBe(1);
  });
});
