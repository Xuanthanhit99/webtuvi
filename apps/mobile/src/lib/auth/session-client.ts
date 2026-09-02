/**
 * Phase 02: the backend now accepts mobile Bearer-token auth (see
 * apps/api/src/auth/auth.controller.ts's mobile* endpoints and
 * apps/api/src/common/guards/access-token.util.ts). This module is the ONLY place mobile tokens
 * are persisted — `expo-secure-store` (iOS Keychain / Android Keystore), never AsyncStorage, since
 * these are the same class of credential the web app deliberately keeps out of JS-readable storage
 * via httpOnly cookies. Never log the contents of a StoredSession.
 */

import * as SecureStore from 'expo-secure-store';
import type { UserDto } from '@beaconvie/types';

const SESSION_KEY = 'menhvi.session.v1';
const USER_CACHE_KEY = 'menhvi.session.user.v1';

export interface StoredSession {
  accessToken: string;
  refreshToken: string;
}

export async function getStoredSession(): Promise<StoredSession | null> {
  const raw = await SecureStore.getItemAsync(SESSION_KEY).catch(() => null);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredSession;
  } catch {
    return null;
  }
}

export async function setStoredSession(session: StoredSession): Promise<void> {
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
}

/** Last-known-good profile, refreshed every time `GET /auth/me` succeeds. Purely a fallback for
 *  the "network unreachable at boot" case (see auth-provider.tsx) so that state can show the
 *  user's real last-fetched name/email instead of either a fabricated placeholder or a jarring
 *  drop to Guest over a temporary connection loss. Never treated as proof of a valid session on
 *  its own — only ever read alongside a still-present StoredSession. */
export async function getCachedUser(): Promise<UserDto | null> {
  const raw = await SecureStore.getItemAsync(USER_CACHE_KEY).catch(() => null);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserDto;
  } catch {
    return null;
  }
}

export async function setCachedUser(user: UserDto): Promise<void> {
  await SecureStore.setItemAsync(USER_CACHE_KEY, JSON.stringify(user));
}

export async function clearStoredSession(): Promise<void> {
  await SecureStore.deleteItemAsync(SESSION_KEY).catch(() => undefined);
  await SecureStore.deleteItemAsync(USER_CACHE_KEY).catch(() => undefined);
}
