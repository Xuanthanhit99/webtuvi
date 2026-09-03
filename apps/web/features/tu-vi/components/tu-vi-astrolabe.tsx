import { cn } from '@/lib/cn';

export function TuViAstrolabe({ className }: { className?: string }) {
  const spokes = Array.from({ length: 12 }, (_, index) => index * 30);

  return (
    <svg viewBox="0 0 420 420" aria-hidden="true" className={cn('overflow-visible text-[#d5ad62]', className)}>
      <defs>
        <radialGradient id="tu-vi-brass" cx="42%" cy="36%">
          <stop offset="0" stopColor="#f2d99b" stopOpacity="0.8" />
          <stop offset="0.48" stopColor="#d5ad62" stopOpacity="0.34" />
          <stop offset="1" stopColor="#6e4d25" stopOpacity="0" />
        </radialGradient>
        <filter id="tu-vi-soft-glow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="7" /></filter>
      </defs>
      <circle cx="210" cy="210" r="190" fill="url(#tu-vi-brass)" opacity="0.24" filter="url(#tu-vi-soft-glow)" />
      <g fill="none" stroke="currentColor">
        <circle cx="210" cy="210" r="174" strokeOpacity="0.22" />
        <circle cx="210" cy="210" r="151" strokeOpacity="0.5" strokeWidth="1.5" />
        <circle cx="210" cy="210" r="119" strokeOpacity="0.28" />
        <circle cx="210" cy="210" r="76" strokeOpacity="0.4" />
        <path d="M210 91 329 210 210 329 91 210Z" strokeOpacity="0.42" />
        <path d="M210 134 286 210 210 286 134 210Z" strokeOpacity="0.35" />
        {spokes.map((rotation) => <path key={rotation} d="M210 36V62 M210 358V384" transform={`rotate(${rotation} 210 210)`} strokeOpacity="0.55" />)}
      </g>
      <g fill="currentColor">
        {spokes.map((rotation) => <circle key={rotation} cx="210" cy="51" r="3" transform={`rotate(${rotation} 210 210)`} opacity="0.72" />)}
        <circle cx="210" cy="210" r="7" opacity="0.9" /><circle cx="210" cy="210" r="2" fill="#f2eee5" />
      </g>
      <path d="M53 268c61-42 102-18 157-39 58-22 93-74 157-57" fill="none" stroke="#708c79" strokeOpacity="0.34" strokeWidth="1.5" />
      <path d="M69 287c49-24 85-8 139-29 62-24 104-62 150-57" fill="none" stroke="#708c79" strokeOpacity="0.2" />
    </svg>
  );
}
