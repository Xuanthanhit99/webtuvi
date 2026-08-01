interface Pattern {
  label: string;
  test: RegExp;
}

const BROWSERS: Pattern[] = [
  { label: 'Edge', test: /Edg\// },
  { label: 'Chrome', test: /Chrome\// },
  { label: 'Firefox', test: /Firefox\// },
  { label: 'Safari', test: /Version\/.*Safari\// },
];

const PLATFORMS: Pattern[] = [
  { label: 'Windows', test: /Windows/ },
  { label: 'macOS', test: /Mac OS X/ },
  { label: 'iOS', test: /iPhone|iPad/ },
  { label: 'Android', test: /Android/ },
  { label: 'Linux', test: /Linux/ },
];

/**
 * Small, dependency-free heuristic label ("Chrome on Windows") for the
 * Sessions UI — not a full UA parser (no bot/version detail), deliberately
 * kept simple since it's display-only metadata, never used for a security
 * decision.
 */
export function summarizeUserAgent(userAgent: string | null | undefined): string {
  if (!userAgent) return 'Unknown device';

  const browser = BROWSERS.find((p) => p.test.test(userAgent))?.label ?? 'Unknown browser';
  const platform = PLATFORMS.find((p) => p.test.test(userAgent))?.label ?? 'Unknown platform';

  return `${browser} on ${platform}`;
}
