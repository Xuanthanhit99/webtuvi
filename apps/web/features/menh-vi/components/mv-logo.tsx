import { cn } from '@/lib/cn';

/**
 * Interim brand mark — simple geometric compass/star glyph, per reference breakdown §8.
 * Ships as CODE now; docs/design/menh-vi-asset-requirements.md Asset 08 lists an optional
 * illustrated refinement as P2 polish.
 */
export function MvLogo({ className, withWordmark = true }: { className?: string; withWordmark?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
        <circle cx="13" cy="13" r="11.5" stroke="#D9BC78" strokeWidth="1" opacity="0.4" />
        <path
          d="M13 3.5L15.1 10.9L22.5 13L15.1 15.1L13 22.5L10.9 15.1L3.5 13L10.9 10.9L13 3.5Z"
          fill="#D9BC78"
        />
        <circle cx="13" cy="13" r="2" fill="#080B14" />
      </svg>
      {withWordmark && (
        <span className="font-display text-body-lg font-medium tracking-wide text-mv-text">MỆNH VI</span>
      )}
    </span>
  );
}
