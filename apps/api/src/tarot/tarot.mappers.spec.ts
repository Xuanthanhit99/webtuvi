import type { TarotCard } from '@prisma/client';
import { toTarotCardDto } from './tarot.mappers';

describe('Tarot mappers — Vietnamese product content', () => {
  it('keeps canonical identity while serving Vietnamese meanings, keywords, prompts and topic copy', () => {
    const card = {
      id: 'card-1',
      slug: 'major-00-the-fool',
      name: 'The Fool',
      nameVi: 'Kẻ Khờ',
      arcana: 'MAJOR',
      suit: null,
      number: 0,
      uprightKeywords: ['new beginnings', 'spontaneity', 'innocence'],
      uprightMeaning: 'A fresh start.',
      reversedKeywords: ['recklessness', 'naivety'],
      reversedMeaning: 'Leaping without looking.',
      element: 'Air',
      astrological: 'Uranus',
      categories: ['change'],
      imageSlug: 'major-00-the-fool',
      reflectionPrompts: ['What would you try?'],
      loveMeaning: 'English love copy.',
      careerMeaning: 'English career copy.',
      financeMeaning: 'English finance copy.',
      selfMeaning: 'English self copy.',
      deckVersion: 'tarot-v1-78',
      createdAt: new Date(),
    } as TarotCard;

    const dto = toTarotCardDto(card);

    expect(dto.slug).toBe(card.slug);
    expect(dto.name).toBe('The Fool');
    expect(dto.nameVi).toBe('Kẻ Khờ');
    expect(dto.deckVersion).toBe(card.deckVersion);
    expect(dto.uprightMeaning).toMatch(/Ở chiều xuôi/);
    expect(dto.reversedMeaning).toMatch(/Ở chiều ngược/);
    expect(dto.uprightKeywords).toContain('khởi đầu mới');
    expect(dto.reflectionPrompts.every((prompt) => prompt.endsWith('?'))).toBe(true);
    expect(dto.loveMeaning).toMatch(/Trong tình yêu/);
    expect(dto.careerMeaning).toMatch(/Với công việc/);
    expect(dto.financeMeaning).toMatch(/Ở khía cạnh tài chính/);
    expect(dto.selfMeaning).toMatch(/Với bản thân/);
    expect(dto.uprightMeaning).not.toBe(card.uprightMeaning);
    expect(dto.loveMeaning).not.toBe(card.loveMeaning);
  });
});
