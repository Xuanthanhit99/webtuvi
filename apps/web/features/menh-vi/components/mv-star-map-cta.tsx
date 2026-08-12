import Image from 'next/image';

export function MvStarMapCta() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-mv-border" style={{ aspectRatio: '900 / 560' }}>
      <Image
        src="/assets/menh-vi/banners/star-map-banner.webp"
        alt=""
        fill
        sizes="(min-width: 1280px) 360px, 100vw"
        className="object-cover"
        loading="lazy"
      />
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(0deg, rgba(8,11,20,0.88) 0%, rgba(8,11,20,0.35) 45%, transparent 70%)' }}
      />
      <div className="absolute inset-x-0 bottom-0 p-5">
        <p className="text-caption font-semibold uppercase tracking-wider text-mv-gold">Khám phá bản đồ sao</p>
        <p className="mt-1 text-body-sm text-mv-text-secondary">Hiểu hơn về con người thật của bạn</p>
        <button
          type="button"
          className="mt-4 w-full rounded-full bg-mv-violet px-4 py-2 text-body-sm font-semibold text-mv-text transition-transform duration-fast hover:scale-[1.02]"
        >
          Khám phá ngay
        </button>
      </div>
    </div>
  );
}
