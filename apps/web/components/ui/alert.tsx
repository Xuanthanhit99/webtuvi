import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '@/lib/cn';

export type AlertVariant = 'info' | 'success' | 'error';

const VARIANT_CLASSES: Record<AlertVariant, string> = {
  info: 'border-border-subtle bg-surface text-text-secondary',
  success: 'border-trust/40 bg-trust/10 text-trust',
  error: 'border-caution/40 bg-caution/10 text-caution',
};

const ICONS: Record<AlertVariant, typeof Info> = {
  info: Info,
  success: CheckCircle2,
  error: AlertTriangle,
};

export interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}

export function Alert({ variant = 'info', title, children, action }: AlertProps) {
  const Icon = ICONS[variant];
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={cn('flex items-start gap-3 rounded-md border p-4 text-body-sm', VARIANT_CLASSES[variant])}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="flex-1">
        {title && <p className="font-semibold text-text-primary">{title}</p>}
        <div>{children}</div>
        {action && <div className="mt-2">{action}</div>}
      </div>
    </div>
  );
}
