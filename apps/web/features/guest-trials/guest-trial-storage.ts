'use client';

const GUEST_TAROT_KEY = 'mv_guest_tarot_preview';
const GUEST_NUMEROLOGY_KEY = 'mv_guest_numerology_preview';

export const GUEST_TRIAL_TTL_MS = 30 * 60 * 1000;

export interface GuestTarotTrial {
  type: 'tarot';
  cardName: string;
  cardMeaning: string;
  createdAt: number;
  expiresAt: number;
}

export interface GuestNumerologyTrial {
  type: 'numerology';
  birthDate: string;
  lifePath: number;
  createdAt: number;
  expiresAt: number;
}

function safeSessionStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function withExpiry<T extends { createdAt: number; expiresAt: number }>(value: Omit<T, 'createdAt' | 'expiresAt'>, now = Date.now()): T {
  return { ...value, createdAt: now, expiresAt: now + GUEST_TRIAL_TTL_MS } as T;
}

function readJson<T extends { expiresAt: number }>(key: string, now = Date.now()): T | null {
  const storage = safeSessionStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as T;
    if (!parsed.expiresAt || parsed.expiresAt <= now) {
      storage.removeItem(key);
      return null;
    }
    return parsed;
  } catch {
    storage.removeItem(key);
    return null;
  }
}

function writeJson<T>(key: string, value: T): void {
  const storage = safeSessionStorage();
  if (!storage) return;
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // Session storage is best-effort trial continuity only.
  }
}

export function saveGuestTarotTrial(card: { name: string; meaning: string }, now = Date.now()): void {
  writeJson<GuestTarotTrial>(
    GUEST_TAROT_KEY,
    withExpiry<GuestTarotTrial>({ type: 'tarot', cardName: card.name, cardMeaning: card.meaning }, now),
  );
}

export function readGuestTarotTrial(now = Date.now()): GuestTarotTrial | null {
  return readJson<GuestTarotTrial>(GUEST_TAROT_KEY, now);
}

export function saveGuestNumerologyTrial(input: { birthDate: string; lifePath: number }, now = Date.now()): void {
  writeJson<GuestNumerologyTrial>(
    GUEST_NUMEROLOGY_KEY,
    withExpiry<GuestNumerologyTrial>({ type: 'numerology', birthDate: input.birthDate, lifePath: input.lifePath }, now),
  );
}

export function readGuestNumerologyTrial(now = Date.now()): GuestNumerologyTrial | null {
  return readJson<GuestNumerologyTrial>(GUEST_NUMEROLOGY_KEY, now);
}

export function clearGuestNumerologyTrial(): void {
  const storage = safeSessionStorage();
  if (!storage) return;
  storage.removeItem(GUEST_NUMEROLOGY_KEY);
}
