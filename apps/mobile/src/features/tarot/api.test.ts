import { tarotApi } from './api';
import { api } from '@/lib/api-client';

jest.mock('@/lib/api-client', () => ({
  api: { get: jest.fn(), post: jest.fn(), delete: jest.fn() },
}));

describe('Tarot mobile API contract', () => {
  beforeEach(() => jest.clearAllMocks());

  it('draws a daily reading using the backend-supported DTO', async () => {
    await tarotApi.draw('DAILY_DRAW');
    expect(api.post).toHaveBeenCalledWith('/tarot/draw', { type: 'DAILY_DRAW', question: undefined });
  });

  it('passes an optional question without unsupported selection fields', async () => {
    await tarotApi.draw('THREE_CARD', 'Tôi nên tập trung vào điều gì?');
    expect(api.post).toHaveBeenCalledWith('/tarot/draw', {
      type: 'THREE_CARD',
      question: 'Tôi nên tập trung vào điều gì?',
    });
  });
});
