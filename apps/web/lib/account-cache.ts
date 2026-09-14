import type { Query, QueryClient } from '@tanstack/react-query';

function isPrivate(query: Query): boolean {
  const [feature, resource] = query.queryKey;
  // Only the two explicitly public catalogs survive an account boundary.
  return !((feature === 'tarot' && resource === 'deck') || (feature === 'numerology' && resource === 'meanings'));
}

export async function clearAccountCache(client: QueryClient): Promise<void> {
  await client.cancelQueries({ predicate: isPrivate });
  client.removeQueries({ predicate: isPrivate });
  client.getMutationCache().clear();
  client.setQueryData(['auth', 'me'], null);
  // Journal recovery text is private even though it is outside React Query.
  if (typeof window !== 'undefined') {
    try {
      for (const key of Object.keys(window.localStorage)) {
        if (key.startsWith('beaconvie:journal-draft:')) window.localStorage.removeItem(key);
      }
    } catch {
      // Storage can be unavailable; session invalidation must still complete.
    }
  }
}
