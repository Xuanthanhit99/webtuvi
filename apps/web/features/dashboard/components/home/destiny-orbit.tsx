import Image from 'next/image';

/**
 * "Đông Phương Thiên Nghi" — the Home hero's signature celestial instrument.
 *
 * BOARD 01 LOCKED IMPLEMENTATION note: this used to be a hand-authored SVG (V4 through V8 each
 * redrew it — first a thick cast-metal chassis, then a thin engraved-diagram redraw). The
 * founder-approved Board 01 reference ships its own final artwork for this instrument at
 * apps/web/public/assets/menh_vi_board01_generated_assets/08_destiny_wheel.{png,webp}, and that
 * approved asset is now the sole visual authority — no SVG approximation of it should exist in
 * this codebase. The asset is a single flattened image (rings, Earthly Branch glyphs, and glow
 * baked into one raster), so it cannot be partially rotated without either spinning the glyph
 * labels upside-down (breaking their "static, readable" requirement) or fabricating a separate
 * ring layer that doesn't exist in the approved art. Per the founder's explicit instruction
 * ("if the asset is not separable enough for meaningful rotation, keep it static rather than
 * replacing it with an inaccurate animated SVG — visual fidelity over animation"), the wheel
 * itself is fully static. The only animation here is a soft breathing glow added *behind* the
 * artwork via CSS — it never touches or reinterprets the approved pixels.
 */
export function DestinyOrbit({ className }: { className?: string }) {
  return (
    // `aspect-[455/420]` matches the approved asset's real intrinsic size (see manifest.json) —
    // required so this wrapper has a real height for the `fill` image below to fill. Without it,
    // a `w-full`/`h-full` wrapper inside a grid column with no explicit height collapses to 0px
    // tall (the old hand-authored SVG didn't need this: an <svg viewBox> is intrinsically sized).
    <div className={className} style={{ position: 'relative', aspectRatio: '455 / 420' }}>
      <div
        aria-hidden="true"
        className="absolute inset-[8%] rounded-full opacity-70 motion-safe:animate-[mv-breathe_6s_ease-in-out_infinite]"
        style={{ background: 'radial-gradient(circle, rgba(224,189,114,0.35) 0%, rgba(198,146,67,0.12) 45%, transparent 72%)', filter: 'blur(6px)' }}
      />
      <Image
        src="/assets/menh_vi_board01_generated_assets/08_destiny_wheel.webp"
        alt=""
        aria-hidden="true"
        fill
        sizes="(min-width: 1280px) 560px, (min-width: 768px) 380px, 260px"
        className="relative object-contain"
        priority
      />
    </div>
  );
}
