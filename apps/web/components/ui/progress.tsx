import { Loader2 } from 'lucide-react';

export function ProgressCircular({ label }: { label: string }) {
  return (
    <div role="status" className="flex items-center gap-2 text-body-sm text-text-secondary">
      <Loader2 className="h-4 w-4 animate-spin text-insight" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function ProgressLinear({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-caption text-text-secondary">
        <span>{label}</span>
        <span>{Math.round(value)}%</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={Math.round(value)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        className="h-2 w-full overflow-hidden rounded-full bg-surface-raised"
      >
        <div
          className="h-full rounded-full bg-insight transition-all duration-standard"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}
