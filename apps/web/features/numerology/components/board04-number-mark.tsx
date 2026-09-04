const ORBIT_NUMBERS = ['3', '5', '7', '8', '1', '9'];

/** Decorative geometry only. The central personalized value always comes from API data. */
export function Board04NumberMark({ value = '7', compact = false }: { value?: string; compact?: boolean }) {
  return (
    <div className={`relative mx-auto aspect-square ${compact ? 'w-44 tablet:w-52' : 'w-56 tablet:w-72'}`} aria-hidden="true">
      <div className="absolute inset-[3%] rounded-full border border-[#d8b46b]/25 bg-[radial-gradient(circle_at_50%_45%,rgba(144,92,190,0.24),rgba(22,13,39,0.32)_46%,rgba(7,11,25,0.9)_72%)] shadow-[0_0_90px_rgba(102,58,145,0.25)]" />
      <div className="absolute inset-[15%] rotate-45 rounded-[34%] border border-[#b58ad5]/20" />
      <div className="absolute inset-[27%] rounded-full border border-[#d8b46b]/25" />
      <div className="absolute inset-[36%] rounded-full bg-[#a875cf]/10 blur-xl" />
      <span className="absolute left-1/2 top-[47%] -translate-x-1/2 -translate-y-1/2 font-serif text-[5.25rem] leading-none text-[#f1d69d] drop-shadow-[0_0_30px_rgba(190,133,220,0.55)] tablet:text-[6.5rem]">{value}</span>
      <span className="absolute left-1/2 top-[68%] -translate-x-1/2 whitespace-nowrap text-[0.625rem] font-semibold uppercase tracking-[0.24em] text-[#c6a6de]">số chủ đạo</span>
      {ORBIT_NUMBERS.map((number, index) => {
        const angle = (index / ORBIT_NUMBERS.length) * Math.PI * 2 - Math.PI / 2;
        const radius = compact ? 72 : 98;
        return <span key={`${number}-${index}`} className="absolute left-1/2 top-1/2 hidden font-serif text-sm text-[#d8b46b]/70 tablet:block" style={{ transform: `translate(calc(-50% + ${Math.cos(angle) * radius}px), calc(-50% + ${Math.sin(angle) * radius}px))` }}>{number}</span>;
      })}
    </div>
  );
}
