import { CloudOff } from 'lucide-react';
import { Button } from './button';

export interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  description = "That didn't work. Please try again.",
  onRetry,
  retryLabel = 'Try again',
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-md border border-caution/30 bg-caution/5 px-6 py-10 text-center"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-caution/25 bg-caution/10">
        <CloudOff className="h-5 w-5 text-caution" aria-hidden="true" />
      </div>
      <p className="text-body-md font-medium text-text-primary">{title}</p>
      <p className="max-w-sm text-body-sm text-text-secondary">{description}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
