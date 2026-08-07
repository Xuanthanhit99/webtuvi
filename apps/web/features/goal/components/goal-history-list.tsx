import type { GoalHistoryDto } from '@beaconvie/types';

export function GoalHistoryList({ history }: { history: GoalHistoryDto[] }) {
  if (history.length === 0) return <p className="text-body-sm text-text-secondary">No history yet.</p>;

  return (
    <ul className="flex flex-col gap-2" aria-label="Goal history">
      {history.map((entry) => (
        <li key={entry.id} className="flex flex-col gap-0.5 rounded-md border border-border-subtle bg-surface px-3 py-2">
          <p className="text-body-sm text-text-primary">{entry.detail}</p>
          <p className="text-caption text-text-disabled">{new Date(entry.createdAt).toLocaleString()}</p>
        </li>
      ))}
    </ul>
  );
}
