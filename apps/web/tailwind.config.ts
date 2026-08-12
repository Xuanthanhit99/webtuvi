import type { Config } from 'tailwindcss';

// Values mirror packages/config/tokens.ts (single source of truth, documented
// against docs/reference Module 4 §16). Duplicated here as plain literals rather
// than imported, since Tailwind's config loader must stay dependency-free of the
// Next.js/TS build pipeline.
const config: Config = {
  darkMode: ['class'],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './features/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#161428',
        surface: '#1F1C36',
        'surface-raised': '#2A2645',
        'canvas-light': '#F5F2F6',
        'surface-light': '#FFFFFF',
        'text-primary': '#F1ECE4',
        'text-secondary': '#B7AFC9',
        'text-disabled': '#6E6785',
        'text-primary-light': '#211D33',
        insight: '#E3B368',
        reflection: '#9A7FA6',
        trust: '#7E9787',
        caution: '#C17B6B',
        'border-subtle': '#332F52',
        'border-focus': '#E3B368',

        // Mệnh Vi (docs/design/menh-vi-reference-breakdown.md) — namespaced `mv-*` so this
        // exploration's palette never collides with or overrides BeaconVie's tokens above.
        // Isolated to apps/web/app/menh-vi/** and apps/web/features/menh-vi/**.
        'mv-bg': '#080B14',
        'mv-elevated': '#101323',
        'mv-surface': '#15182B',
        'mv-violet': '#7765FF',
        'mv-violet-secondary': '#9A83FF',
        'mv-gold': '#D9BC78',
        'mv-text': '#F4F1EA',
        'mv-text-secondary': '#A6A5B2',
        'mv-muted': '#727180',
        'mv-rose': '#C98BA0',
        'mv-border': 'rgba(217, 188, 120, 0.16)',
      },
      fontFamily: {
        display: ['var(--font-fraunces)', 'Georgia', 'serif'],
        body: ['var(--font-karla)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      fontSize: {
        'display-xl': ['3.5rem', { lineHeight: '1.1' }],
        'display-lg': ['2.5rem', { lineHeight: '1.15' }],
        'heading-lg': ['1.75rem', { lineHeight: '1.25' }],
        'heading-md': ['1.375rem', { lineHeight: '1.3' }],
        'body-lg': ['1.125rem', { lineHeight: '1.5' }],
        'body-md': ['1rem', { lineHeight: '1.5' }],
        'body-sm': ['0.875rem', { lineHeight: '1.4' }],
        caption: ['0.75rem', { lineHeight: '1.3' }],
      },
      spacing: {
        18: '4.5rem',
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '20px',
        xl: '28px',
      },
      boxShadow: {
        sm: '0 4px 12px rgba(0,0,0,0.2)',
        'mv-glow-violet': '0 0 32px rgba(119, 101, 255, 0.28)',
        'mv-glow-gold': '0 0 24px rgba(217, 188, 120, 0.22)',
      },
      transitionDuration: {
        fast: '200ms',
        standard: '250ms',
        deliberate: '600ms',
        report: '1500ms',
      },
      transitionTimingFunction: {
        organic: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      zIndex: {
        dropdown: '100',
        drawer: '200',
        sheet: '300',
        modal: '400',
        toast: '500',
      },
      screens: {
        tablet: '768px',
        desktop: '1280px',
        // Mệnh Vi top nav's full icon+label state — deliberately wider than `desktop` (which
        // also gates the sidebar + 4-col feature grid) so the two don't compete for space at
        // the same 1280px boundary. See docs/design/menh-vi-reference-breakdown.md Round 3.
        'mv-wide': '1440px',
      },
      maxWidth: {
        content: '1120px',
        reading: '720px',
        'mv-content': '1360px',
      },
      keyframes: {
        'mv-orbit-spin': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        'mv-orbit-spin-reverse': {
          from: { transform: 'rotate(360deg)' },
          to: { transform: 'rotate(0deg)' },
        },
      },
      animation: {
        'mv-orbit-slow': 'mv-orbit-spin 48s linear infinite',
        'mv-orbit-slower': 'mv-orbit-spin-reverse 64s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
