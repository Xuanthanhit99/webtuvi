import type { LabelHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn('block text-body-sm font-medium text-text-primary mb-2', className)} {...props} />;
}
