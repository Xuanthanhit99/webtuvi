import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export type BadgeVariant = 'neutral' | 'insight' | 'new' | 'high' | 'medium' | 'low';

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  neutral: 'bg-surface-raised text-text-secondary',
  insight: 'bg-insight/15 text-insight',
  new: 'bg-trust/15 text-trust',
  high: 'bg-caution/15 text-caution',
  medium: 'bg-insight/15 text-insight',
  low: 'bg-surface-raised text-text-secondary',
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ variant = 'neutral', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-sm px-2 py-0.5 text-caption font-medium',
        VARIANT_CLASSES[variant],
        className,
      )}
      {...props}
    />
  );
}
