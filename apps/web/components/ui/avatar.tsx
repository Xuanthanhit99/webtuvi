import { cn } from '@/lib/cn';

export type AvatarSize = 'sm' | 'md' | 'lg';

const SIZE_CLASSES: Record<AvatarSize, string> = {
  sm: 'h-6 w-6 text-caption',
  md: 'h-10 w-10 text-body-sm',
  lg: 'h-16 w-16 text-heading-md',
};

export function Avatar({ name, size = 'md' }: { name: string; size?: AvatarSize }) {
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  return (
    <span
      role="img"
      aria-label={name}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-insight/20 font-semibold text-insight',
        SIZE_CLASSES[size],
      )}
    >
      {initial}
    </span>
  );
}
