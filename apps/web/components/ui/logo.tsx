import { cn } from '@/lib/cn';

export function Logo({ className, withWordmark = true }: { className?: string; withWordmark?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="5" cy="18" r="1.6" fill="#E3B368" />
        <circle cx="12" cy="6" r="1.6" fill="#E3B368" />
        <circle cx="19" cy="15" r="1.6" fill="#E3B368" />
        <path d="M5 18L12 6L19 15" stroke="#E3B368" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
      </svg>
      {withWordmark && <span className="font-display text-body-lg font-medium text-text-primary">BeaconVie</span>}
    </span>
  );
}
