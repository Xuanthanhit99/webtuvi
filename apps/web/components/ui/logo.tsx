import { cn } from '@/lib/cn';

export function Logo({ className, withWordmark = true }: { className?: string; withWordmark?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="5" cy="18" r="1.6" fill="#D5AD62" />
        <circle cx="12" cy="6" r="1.6" fill="#D5AD62" />
        <circle cx="19" cy="15" r="1.6" fill="#D5AD62" />
        <path d="M5 18L12 6L19 15" stroke="#D5AD62" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
      </svg>
      {withWordmark && <span className="text-body-lg font-semibold text-text-primary">Tử Vi Tarot</span>}
    </span>
  );
}
