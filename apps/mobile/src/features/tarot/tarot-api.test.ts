import { requiredCardCount, validatePositions, tarotApi } from './tarot-api';
import { api } from '@/lib/api-client';

jest.mock('@/lib/api-client', () => ({ api: { get: jest.fn(), post: jest.fn() }, apiFetch: jest.fn() }));
const post = api.post as jest.Mock;

describe('Tarot server-backed selection contract', () => {
  beforeEach(() => jest.clearAllMocks());

  it('requires one card for daily/single and three for three-card spreads', () => {
    expect(requiredCardCount('DAILY_DRAW')).toBe(1);
    expect(requiredCardCount('SINGLE_CARD')).toBe(1);
    expect(requiredCardCount('THREE_CARD')).toBe(3);
  });

  it('rejects duplicate, out-of-range and incomplete positions', () => {
    expect(() => validatePositions('THREE_CARD', [1, 1, 2])).toThrow();
    expect(() => validatePositions('THREE_CARD', [1, 2])).toThrow();
    expect(() => validatePositions('SINGLE_CARD', [78])).toThrow();
    expect(() => validatePositions('DAILY_DRAW', [-1])).toThrow();
  });

  it('requests a server-side shuffle without exposing the deck order', async () => {
    post.mockResolvedValueOnce({ token: 'server-token' });
    const session = await tarotApi.selectionSession('THREE_CARD');
    expect(session.token).toBe('server-token');
    expect(post).toHaveBeenCalledWith('/tarot/selection-session', { type: 'THREE_CARD' });
  });

  it('submits only server token and selected positions, never locally generated cards', async () => {
    post.mockResolvedValueOnce({ id: 'reading-1' });
    await tarotApi.draw('THREE_CARD', 'server-generated-token-123456', [4, 17, 61], 'Tình cảm');
    expect(post).toHaveBeenCalledWith('/tarot/draw', {
      type: 'THREE_CARD', selectionToken: 'server-generated-token-123456', selectedPositions: [4, 17, 61], question: 'Tình cảm',
    });
  });

  it('does not call backend with an invalid selection', () => {
    expect(() => tarotApi.draw('THREE_CARD', 'server-generated-token-123456', [4, 4, 61])).toThrow();
    expect(post).not.toHaveBeenCalled();
  });
});
