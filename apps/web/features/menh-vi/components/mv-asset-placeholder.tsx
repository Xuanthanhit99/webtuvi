import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/cn';

interface MvAssetPlaceholderProps {
  filename: string;
  width: number;
  height: number;
  className?: string;
  rounded?: string;
}

/**
 * Visible dev placeholder for art listed in docs/design/menh-vi-asset-requirements.md.
 * Deliberately looks unfinished — never a fabricated stand-in — until the real file lands
 * at the target path.
 */
export function MvAssetPlaceholder({ filename, width, height, className, rounded = 'rounded-lg' }: MvAssetPlaceholderProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-1 border border-dashed border-mv-gold/30 bg-mv-surface/60 text-center',
        rounded,
        className,
      )}
      style={{ aspectRatio: `${width} / ${height}` }}
      role="img"
      aria-label={`Placeholder for asset ${filename}, ${width} by ${height} pixels, not yet supplied`}
    >
      <ImageOff className="h-5 w-5 text-mv-muted" aria-hidden="true" />
      <span className="text-[10px] font-semibold uppercase tracking-wide text-mv-muted">Asset required</span>
      <span className="px-2 text-[10px] text-mv-muted/80">{filename}</span>
      <span className="text-[10px] text-mv-muted/60">
        {width}×{height}
      </span>
    </div>
  );
}
