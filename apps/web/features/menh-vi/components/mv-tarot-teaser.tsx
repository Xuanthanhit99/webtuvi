import Image from 'next/image';

export function MvTarotTeaser() {
  return (
    <div className="group flex flex-col rounded-xl border border-mv-border bg-mv-elevated p-5">
      <p className="text-caption font-semibold uppercase tracking-wider text-mv-gold">Một lá bài dành cho bạn</p>
      <div className="mt-3 flex flex-1 items-center gap-4">
        <div className="relative h-32 w-[84px] shrink-0 overflow-hidden rounded-md border border-mv-border transition-transform duration-standard group-hover:-rotate-2">
          <Image
            src="/assets/menh-vi/tarot/tarot-card-back.webp"
            alt=""
            fill
            sizes="84px"
            className="object-cover"
          />
        </div>
        <p className="text-body-sm text-mv-text-secondary">Vũ trụ muốn gửi đến bạn một thông điệp hôm nay.</p>
      </div>
      <button
        type="button"
        className="mt-4 rounded-full bg-mv-gold px-4 py-2.5 text-body-sm font-semibold text-mv-bg transition-transform duration-fast hover:scale-[1.02]"
      >
        Rút 1 lá bài
      </button>
    </div>
  );
}
