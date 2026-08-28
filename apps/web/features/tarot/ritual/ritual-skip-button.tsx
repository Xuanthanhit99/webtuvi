'use client';

/**
 * The brief's global skip rule: any mandatory ritual step longer than ~1.5s needs a visible,
 * unobtrusive way past it. Reused by both the shuffle and the reveal-flip sequence — skipping only
 * fast-forwards the visual stage, never touches the real draw/selection data underneath it.
 */
export function RitualSkipButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-11 items-center px-3 text-caption font-medium text-text-tertiary underline-offset-4 transition-colors hover:text-insight hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-insight"
    >
      Bỏ qua
    </button>
  );
}
