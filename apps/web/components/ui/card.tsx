import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-md border border-border-subtle bg-surface p-4 shadow-[0_16px_48px_rgba(0,0,0,0.18)]', className)} {...props} />;
}

export function CardElevated({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-md border border-[rgba(213,173,98,0.16)] bg-surface-raised p-4 shadow-[0_20px_60px_rgba(0,0,0,0.28)]', className)} {...props} />;
}
