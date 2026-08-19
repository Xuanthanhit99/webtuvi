/**
 * BeaconVie design tokens.
 * Source of truth: docs/reference Product Bible, Module 4 "Product Experience & Design System", Section 16.
 * Do not hand-edit values here without updating the source doc reference above.
 */

export const color = {
  bg: {
    canvas: '#161428',
    surface: '#1F1C36',
    surfaceRaised: '#2A2645',
    canvasLight: '#F5F2F6',
    surfaceLight: '#FFFFFF',
  },
  text: {
    primary: '#F1ECE4',
    secondary: '#B7AFC9',
    // Accessibility + Product Polish (2026-08-19): `disabled` measured 3.09-3.38:1 against
    // canvas/surface — fails WCAG AA's 4.5:1 for normal text — yet was used for real readable
    // content (timestamps, disclosure copy) almost everywhere, not just genuinely-disabled
    // controls. Split rather than redefined: `disabled` keeps its original value, reserved for
    // text that is part of an inactive/disabled UI control (WCAG 1.4.3's own explicit exemption —
    // see oauth-buttons.tsx, the one remaining legitimate usage). `tertiary` is the new token for
    // readable secondary/supporting/disclosure text, verified >=4.5:1 against both canvas and
    // surface — see docs/progress/accessibility-product-polish-final-report.md for the full
    // contrast table.
    tertiary: '#9A93AE',
    disabled: '#6E6785',
    primaryLight: '#211D33',
  },
  accent: {
    insight: '#E3B368',
    reflection: '#9A7FA6',
    trust: '#7E9787',
    caution: '#C17B6B',
  },
  border: {
    subtle: '#332F52',
    focus: '#E3B368',
  },
} as const;

export const typography = {
  fontFamily: {
    display: 'Fraunces',
    body: 'Karla',
    mono: 'IBM Plex Mono',
  },
  scale: {
    displayXl: '3.5rem',
    displayLg: '2.5rem',
    headingLg: '1.75rem',
    headingMd: '1.375rem',
    bodyLg: '1.125rem',
    bodyMd: '1rem',
    bodySm: '0.875rem',
    caption: '0.75rem',
  },
} as const;

export const spacing = {
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  6: '24px',
  8: '32px',
  12: '48px',
  16: '64px',
} as const;

export const radius = {
  sm: '8px',
  md: '12px',
  lg: '20px',
  xl: '28px',
  full: '9999px',
} as const;

export const elevation = {
  shadowSm: '0 4px 12px rgba(0,0,0,0.2)',
} as const;

export const animation = {
  durationFast: '200ms',
  durationStandard: '250ms',
  durationDeliberate: '600ms',
  durationReport: '1500ms',
  easeStandard: 'ease-in-out',
  easeOut: 'ease-out',
  easeOrganic: 'cubic-bezier(0.22, 1, 0.36, 1)',
} as const;

export const zIndex = {
  base: 0,
  dropdown: 100,
  drawer: 200,
  sheet: 300,
  modal: 400,
  toast: 500,
} as const;

export const breakpoints = {
  mobile: '0px',
  tablet: '768px',
  desktop: '1280px',
} as const;

export const tokens = {
  color,
  typography,
  spacing,
  radius,
  elevation,
  animation,
  zIndex,
  breakpoints,
} as const;

export default tokens;
