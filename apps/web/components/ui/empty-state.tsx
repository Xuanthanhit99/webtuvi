import { Sparkles } from 'lucide-react';

export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border-subtle px-6 py-10 text-center">
      <Sparkles className="h-6 w-6 text-insight" aria-hidden="true" />
      <p className="text-body-md font-medium text-text-primary">{title}</p>
      {description && <p className="max-w-sm text-body-sm text-text-secondary">{description}</p>}
      {action}
    </div>
  );
}
