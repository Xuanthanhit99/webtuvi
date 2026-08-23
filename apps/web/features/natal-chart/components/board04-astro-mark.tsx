import { PLANET_GLYPHS } from '../labels';

const ZODIAC_GLYPHS = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];

/** Purely decorative Board 04 astrology mark. Real chart data is rendered by NatalChartWheel. */
export function Board04AstroMark({ compact = false }: { compact?: boolean }) {
  const sizeClass = compact ? 'h-48 w-48' : 'h-64 w-64 tablet:h-80 tablet:w-80';
  const planets = Object.values(PLANET_GLYPHS).slice(0, 8);

  return (
    <div className={`relative mx-auto ${sizeClass}`} aria-hidden="true">
      <div className="absolute inset-0 rounded-full border border-[#d5ad62]/35 bg-[#07111d]/80 shadow-[0_0_80px_rgba(213,173,98,0.16)]" />
      <div className="absolute inset-5 rounded-full border border-[#59c7b5]/20" />
      <div className="absolute inset-12 rounded-full border border-[#d5ad62]/25" />
      <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#efb96c] shadow-[0_0_34px_rgba(239,185,108,0.72)]" />
      <div className="absolute left-1/2 top-1/2 h-px w-[42%] origin-left rotate-[23deg] bg-[#d5ad62]/45" />
      <div className="absolute left-1/2 top-1/2 h-px w-[34%] origin-left rotate-[148deg] bg-[#59c7b5]/35" />
      <div className="absolute left-1/2 top-1/2 h-px w-[39%] origin-left -rotate-[78deg] bg-[#d5ad62]/35" />
      {ZODIAC_GLYPHS.map((glyph, index) => {
        const angle = (index / ZODIAC_GLYPHS.length) * Math.PI * 2 - Math.PI / 2;
        const radius = compact ? 82 : 125;
        return (
          <span
            key={glyph}
            className="absolute left-1/2 top-1/2 font-serif text-sm text-[#efb96c]"
            style={{ transform: `translate(calc(-50% + ${Math.cos(angle) * radius}px), calc(-50% + ${Math.sin(angle) * radius}px))` }}
          >
            {glyph}
          </span>
        );
      })}
      {planets.map((glyph, index) => {
        const angle = (index / planets.length) * Math.PI * 2 + Math.PI / 8;
        const radius = compact ? 56 : 86;
        return (
          <span
            key={`${glyph}-${index}`}
            className="absolute left-1/2 top-1/2 text-xs text-[#8ddbd0]"
            style={{ transform: `translate(calc(-50% + ${Math.cos(angle) * radius}px), calc(-50% + ${Math.sin(angle) * radius}px))` }}
          >
            {glyph}
          </span>
        );
      })}
    </div>
  );
}
