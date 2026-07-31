import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, invalid, ...props }, ref) => {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        'h-11 w-full rounded-md border bg-surface px-3 text-body-md text-text-primary placeholder:text-text-disabled',
        'transition-colors duration-fast focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-insight',
        'disabled:cursor-not-allowed disabled:opacity-50',
        invalid ? 'border-caution' : 'border-border-subtle',
        className,
      )}
      {...props}
    />
  );
});
Input.displayName = 'Input';
