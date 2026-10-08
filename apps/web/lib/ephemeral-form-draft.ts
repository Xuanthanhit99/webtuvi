/** One-shot tab-scoped draft. Never persisted beyond this browser tab or TTL. */
export function saveEphemeralDraft<T>(key: string, value: T, ttlMs: number): void {
  try {
    window.sessionStorage.setItem(key, JSON.stringify({ value, expiresAt: Date.now() + ttlMs }));
  } catch { /* Private browsing or storage disabled. */ }
}
export function takeEphemeralDraft<T>(key: string, validate: (value: unknown) => value is T): T | null {
  try {
    const raw = window.sessionStorage.getItem(key);
    window.sessionStorage.removeItem(key);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const record = parsed as { value?: unknown; expiresAt?: unknown };
    if (typeof record.expiresAt !== 'number' || !Number.isFinite(record.expiresAt) || Date.now() >= record.expiresAt) return null;
    return validate(record.value) ? record.value : null;
  } catch {
    try { window.sessionStorage.removeItem(key); } catch { /* unavailable */ }
    return null;
  }
}
export function clearEphemeralDraft(key: string): void {
  try { window.sessionStorage.removeItem(key); } catch { /* unavailable */ }
}
