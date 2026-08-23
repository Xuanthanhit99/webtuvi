const ORBIT_NUMBERS = ['3', '5', '7', '8', '1', '9'];

/** Purely decorative Board 04 numerology mark. Personalized values are rendered from API data. */
export function Board04NumberMark({ value = '7', compact = false }: { value?: string; compact?: boolean }) {
  const sizeClass = compact ? 'h-48 w-48' : 'h-64 w-64 tablet:h-80 tablet:w-80';
  return (
    <div className={`relative mx-auto ${sizeClass}`} aria-hidden="true">
      <div className="absolute inset-0 rounded-full border border-[#d5ad62]/30 bg-[#07111d]/75 shadow-[0_0_80px_rgba(89,199,181,0.14)]" />
      <div className="absolute inset-8 rounded-full border border-[#59c7b5]/25" />
      <div className="absolute inset-16 rounded-full border border-[#d5ad62]/20" />
      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[56%] font-serif text-7xl text-[#efb96c] drop-shadow-[0_0_28px_rgba(239,185,108,0.45)]">
        {value}
      </span>
      <span className="absolute left-1/2 top-[62%] -translate-x-1/2 text-caption font-semibold uppercase text-[#8ddbd0]/80">
        số chủ đạo
      </span>
      {ORBIT_NUMBERS.map((number, index) => {
        const angle = (index / ORBIT_NUMBERS.length) * Math.PI * 2 - Math.PI / 2;
        const radius = compact ? 76 : 118;
        return (
          <span
            key={`${number}-${index}`}
            className="absolute left-1/2 top-1/2 font-serif text-lg text-[#d5ad62]"
            style={{ transform: `translate(calc(-50% + ${Math.cos(angle) * radius}px), calc(-50% + ${Math.sin(angle) * radius}px))` }}
          >
            {number}
          </span>
        );
      })}
    </div>
  );
}
