import { getStoredSession, setStoredSession, clearStoredSession, getCachedUser, setCachedUser } from './session-client';

jest.mock('expo-secure-store', () => {
  const store = new Map<string, string>();
  return {
    getItemAsync: jest.fn((key: string) => Promise.resolve(store.get(key) ?? null)),
    setItemAsync: jest.fn((key: string, value: string) => {
      store.set(key, value);
      return Promise.resolve();
    }),
    deleteItemAsync: jest.fn((key: string) => {
      store.delete(key);
      return Promise.resolve();
    }),
    __store: store,
  };
});

const secureStore = jest.requireMock('expo-secure-store') as { __store: Map<string, string> };

describe('session-client', () => {
  beforeEach(() => {
    secureStore.__store.clear();
  });

  it('returns null when nothing is stored', async () => {
    await expect(getStoredSession()).resolves.toBeNull();
    await expect(getCachedUser()).resolves.toBeNull();
  });

  it('round-trips a stored session', async () => {
    await setStoredSession({ accessToken: 'access-1', refreshToken: 'refresh-1' });
    await expect(getStoredSession()).resolves.toEqual({ accessToken: 'access-1', refreshToken: 'refresh-1' });
  });

  it('round-trips a cached user profile', async () => {
    const user = { id: '1', email: 'a@b.com', displayName: 'A', emailVerifiedAt: null, onboardingCompletedAt: null, createdAt: '', role: 'USER' as const };
    await setCachedUser(user);
    await expect(getCachedUser()).resolves.toEqual(user);
  });

  it('clearStoredSession removes both the session and the cached user', async () => {
    await setStoredSession({ accessToken: 'a', refreshToken: 'b' });
    await setCachedUser({ id: '1', email: 'a@b.com', displayName: 'A', emailVerifiedAt: null, onboardingCompletedAt: null, createdAt: '', role: 'USER' });

    await clearStoredSession();

    await expect(getStoredSession()).resolves.toBeNull();
    await expect(getCachedUser()).resolves.toBeNull();
  });

  it('returns null (not a throw) for corrupted stored JSON', async () => {
    secureStore.__store.set('menhvi.session.v1', 'not-json{{{');
    await expect(getStoredSession()).resolves.toBeNull();
  });
});
