import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface DropdownOption {
  value: string;
  label: string;
}

export interface DropdownProps {
  id: string;
  label: string;
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  className?: string;
}

/** Native <select>: full keyboard support and screen-reader semantics for free. */
export function Dropdown({ id, label, value, options, onChange, className }: DropdownProps) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-2 block text-body-sm font-medium text-text-primary">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            'h-11 w-full appearance-none rounded-md border border-border-subtle bg-surface px-3 pr-9 text-body-md text-text-primary',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-insight',
          )}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
