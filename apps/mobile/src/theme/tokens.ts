/**
 * Mệnh Vi mobile design tokens.
 *
 * Reconciled from the CURRENT web Home (source of truth), not the app-wide
 * `packages/config/tokens.ts` (a stale/legacy palette Home does not actually use — see the Phase
 * 01 design audit). These values mirror `apps/web/styles/globals.css`'s `--mv-*` custom
 * properties and the bespoke arbitrary values used throughout
 * `apps/web/features/dashboard/components/home/*`.
 */

export const color = {
  bg: '#070B12',
  surface: '#0B1220',
  surfaceElevated: '#101827',
  cardBg: '#0C1420',

  gold: '#D5AD62',
  goldLight: '#E6C980',
  goldMuted: '#8E7243',

  jade: '#708C79',
  seal: '#9D453E',

  textPrimary: '#F2EEE5',
  textSecondary: '#A6A7AC',
  textMuted: '#6F747D',

  borderSubtle: 'rgba(255,255,255,0.07)',
  borderGold: 'rgba(213,173,98,0.16)',

  // Per-module identity tints (feature-grid.tsx's `mix-blend-soft-light` overlay colors — mobile
  // approximates the blend with a plain semi-opaque wash, see FeatureCard).
  moduleTint: {
    tu_vi: 'rgba(158,120,63,0.35)',
    tarot: 'rgba(107,70,140,0.35)',
    natal_chart: 'rgba(59,92,150,0.35)',
    numerology: 'rgba(115,84,168,0.35)',
  },
} as const;

export const font = {
  display: 'Fraunces_600SemiBold',
  displayMedium: 'Fraunces_500Medium',
  body: 'Karla_400Regular',
  bodyMedium: 'Karla_500Medium',
  bodySemibold: 'Karla_600SemiBold',
} as const;

export const fontSize = {
  displayLg: 34,
  displayMd: 28,
  headingLg: 22,
  headingMd: 19,
  bodyLg: 17,
  bodyMd: 15,
  bodySm: 13,
  caption: 11,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 22,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const shadow = {
  gold: {
    shadowColor: '#D5AD62',
    shadowOpacity: 0.28,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  glass: {
    shadowColor: '#000000',
    shadowOpacity: 0.24,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
} as const;

export const motion = {
  fast: 200,
  standard: 250,
  deliberate: 600,
  organicEasing: [0.22, 1, 0.36, 1] as [number, number, number, number],
} as const;
