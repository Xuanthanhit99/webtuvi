import { Sparkles } from 'lucide-react';

export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-[rgba(213,173,98,0.18)] bg-surface/55 px-6 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-insight/25 bg-insight/5">
        <Sparkles className="h-5 w-5 text-insight" aria-hidden="true" />
      </div>
      <p className="text-body-md font-medium text-text-primary">{title}</p>
      {description && <p className="max-w-sm text-body-sm text-text-secondary">{description}</p>}
      {action}
    </div>
  );
}
