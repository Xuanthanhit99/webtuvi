import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: React.ReactNode;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, ...props }, ref) => {
    return (
      <label
        htmlFor={id}
        className="group flex min-h-11 cursor-pointer items-start gap-3 py-1 text-body-sm text-text-secondary"
      >
        <span className="relative mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
          <input
            ref={ref}
            id={id}
            type="checkbox"
            className={cn(
              'peer h-5 w-5 shrink-0 appearance-none rounded border border-border-subtle bg-surface',
              'checked:border-insight checked:bg-insight',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-insight',
              className,
            )}
            {...props}
          />
          <Check
            className="pointer-events-none absolute h-3.5 w-3.5 text-canvas opacity-0 peer-checked:opacity-100"
            aria-hidden="true"
          />
        </span>
        <span>{label}</span>
      </label>
    );
  },
);
Checkbox.displayName = 'Checkbox';
