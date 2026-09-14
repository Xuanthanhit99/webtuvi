import { QueryClient } from '@tanstack/react-query';
import { clearAccountCache } from './account-cache';

it('removes private account and entitlement data while preserving public catalogs', async () => {
  const client = new QueryClient();
  for (const key of [['auth', 'me'], ['premium', 'status'], ['sessions'], ['preferences'], ['memory-consents'], ['tarot', 'readings'], ['dashboard'], ['reports', 'list', {}], ['reports', 'report-1'], ['reports', 'readiness']]) client.setQueryData(key, { owner: 'previous-user' });
  client.setQueryData(['tarot', 'deck'], ['public-card']);
  client.setQueryData(['numerology', 'meanings'], ['public-meaning']);
  localStorage.setItem('beaconvie:journal-draft:old-entry', 'private writing');
  localStorage.setItem('public-preference', 'preserved');
  await clearAccountCache(client);
  expect(client.getQueryData(['auth', 'me'])).toBeNull();
  expect(client.getQueryData(['premium', 'status'])).toBeUndefined();
  expect(client.getQueryData(['tarot', 'readings'])).toBeUndefined();
  // A Personal Destiny Report is among the most personal content in the product — none of it may
  // survive an account boundary and flash into the next account's Reports page.
  expect(client.getQueryData(['reports', 'list', {}])).toBeUndefined();
  expect(client.getQueryData(['reports', 'report-1'])).toBeUndefined();
  expect(client.getQueryData(['reports', 'readiness'])).toBeUndefined();
  expect(client.getQueryCache().getAll()).toHaveLength(3);
  expect(client.getQueryData(['tarot', 'deck'])).toEqual(['public-card']);
  expect(client.getQueryData(['numerology', 'meanings'])).toEqual(['public-meaning']);
  expect(localStorage.getItem('beaconvie:journal-draft:old-entry')).toBeNull();
  expect(localStorage.getItem('public-preference')).toBe('preserved');
  localStorage.removeItem('public-preference');
  client.clear();
});

it('cancels in-flight private queries so a late response cannot restore the previous account', async () => {
  const client = new QueryClient();
  let resolve!: (value: string) => void;
  const request = client.fetchQuery({ queryKey: ['memory', 'old'], queryFn: () => new Promise<string>((done) => { resolve = done; }) }).catch(() => undefined);
  await clearAccountCache(client);
  resolve('private-old-value');
  await request;
  expect(client.getQueryData(['memory', 'old'])).toBeUndefined();
  client.clear();
});
