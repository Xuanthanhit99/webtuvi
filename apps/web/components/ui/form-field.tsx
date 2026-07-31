import { AlertCircle } from 'lucide-react';
import { Label } from './label';

export interface FormFieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}

export function FormField({ label, htmlFor, error, hint, required, children }: FormFieldProps) {
  const errorId = `${htmlFor}-error`;
  const hintId = `${htmlFor}-hint`;

  return (
    <div>
      <Label htmlFor={htmlFor}>
        {label}
        {required && (
          <span aria-hidden="true" className="text-caution">
            {' '}
            *
          </span>
        )}
      </Label>
      {hint && (
        <p id={hintId} className="mb-2 text-caption text-text-secondary">
          {hint}
        </p>
      )}
      {children}
      {error && (
        <p id={errorId} role="alert" className="mt-2 flex items-center gap-1.5 text-body-sm text-caution">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}

export function fieldDescribedBy(htmlFor: string, hasError: boolean, hasHint: boolean): string | undefined {
  const ids = [hasHint && `${htmlFor}-hint`, hasError && `${htmlFor}-error`].filter(Boolean);
  return ids.length > 0 ? ids.join(' ') : undefined;
}
