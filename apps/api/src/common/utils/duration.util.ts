const UNIT_TO_MS = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
} as const;

type DurationUnit = keyof typeof UNIT_TO_MS;

function isDurationUnit(value: string): value is DurationUnit {
  return value in UNIT_TO_MS;
}

/** Parses durations like "15m", "1h", "30d" into milliseconds. */
export function parseDurationMs(value: string): number {
  const match = /^(\d+)(s|m|h|d)$/.exec(value.trim());
  if (!match || !match[1] || !match[2] || !isDurationUnit(match[2])) {
    throw new Error(`Invalid duration string: "${value}" (expected e.g. "15m", "1h", "30d")`);
  }
  return Number(match[1]) * UNIT_TO_MS[match[2]];
}
