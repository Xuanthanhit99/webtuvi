import { tarotApi } from './api';
import { api } from '@/lib/api-client';

jest.mock('@/lib/api-client', () => ({
  api: { get: jest.fn(), post: jest.fn() },
  apiFetch: jest.fn(),
}));

const post = api.post as jest.Mock;
const get = api.get as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Tarot Mobile selection API contract', () => {
  it('requests a 78-card selection session before drawing', async () => {
    post.mockResolvedValueOnce({ token: 'once-only', deckSize: 78, expiresAt: '2026-10-09T12:00:00Z' });
    const session = await tarotApi.createSelectionSession('SINGLE_CARD');
    expect(post).toHaveBeenCalledWith('/tarot/selection-session', { type: 'SINGLE_CARD' });
    expect(session.deckSize).toBe(78);
  });

  it('submits a single selected position with its one-use token', async () => {
    post.mockResolvedValueOnce({ id: 'reading-1' });
    await tarotApi.draw('SINGLE_CARD', 'once-only', [23], 'Tình cảm?');
    expect(post).toHaveBeenCalledWith('/tarot/draw', {
      type: 'SINGLE_CARD', selectionToken: 'once-only', selectedPositions: [23], question: 'Tình cảm?',
    });
  });

  it('preserves three distinct selected positions in the draw request', async () => {
    post.mockResolvedValueOnce({ id: 'reading-3' });
    await tarotApi.draw('THREE_CARD', 'once-only', [0, 12, 77]);
    expect(post).toHaveBeenCalledWith('/tarot/draw', {
      type: 'THREE_CARD', selectionToken: 'once-only', selectedPositions: [0, 12, 77], question: undefined,
    });
  });

  it('fetches persisted reading history and opens a saved reading', async () => {
    get.mockResolvedValueOnce({ items: [{ id: 'reading-1' }] }).mockResolvedValueOnce({ id: 'reading-1' });
    const history = await tarotApi.listReadings();
    const reading = await tarotApi.getReading(history.items[0].id);
    expect(get).toHaveBeenNthCalledWith(1, '/tarot/readings?status=ACTIVE&page=1&pageSize=20');
    expect(get).toHaveBeenNthCalledWith(2, '/tarot/readings/reading-1');
    expect(reading.id).toBe('reading-1');
  });

  it.each([
    ['expired token', 'TAROT_SELECTION_SESSION_EXPIRED'],
    ['consumed token', 'TAROT_SELECTION_SESSION_USED'],
    ['network failure', 'NETWORK_ERROR'],
  ])('propagates %s rejection without inventing a reading', async (_label, code) => {
    const failure = Object.assign(new Error(code), { code });
    post.mockRejectedValueOnce(failure);
    await expect(tarotApi.draw('SINGLE_CARD', 'bad-token', [1])).rejects.toBe(failure);
  });
});
