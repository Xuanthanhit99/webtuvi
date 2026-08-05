'use client';

/** Renders the persisted `scoreExplanation` sentences alongside the raw number — never the score
 * alone (mirrors Memory's own `ImportanceBadge` "never render the number without the array"
 * rule; see docs/architecture/reflection-foundation.md "Scoring"). */
export function ReflectionScoreExplanation({ score, explanation }: { score: number; explanation: string[] }) {
  return (
    <div className="flex flex-col gap-2 rounded-md border border-border-subtle bg-surface p-3">
      <div className="flex items-center gap-2">
        <span className="font-display text-heading-sm text-text-primary">{score}</span>
        <span className="text-caption text-text-disabled">/ 100</span>
      </div>
      {explanation.length === 0 ? (
        <p className="text-body-sm text-text-secondary">No scoring factors applied.</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {explanation.map((line) => (
            <li key={line} className="text-body-sm text-text-secondary">
              {line}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
