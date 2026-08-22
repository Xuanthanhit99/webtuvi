import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-canvas px-4 py-10 text-center">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_28%_20%,rgba(213,173,98,0.16),transparent_30%),radial-gradient(circle_at_78%_72%,rgba(112,140,121,0.12),transparent_34%)]" />
      <section className="relative max-w-[520px] rounded-lg border border-[rgba(213,173,98,0.18)] bg-surface px-6 py-8 shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
        <p className="text-caption font-semibold uppercase tracking-[0.18em] text-insight">Không tìm thấy</p>
        <h1 className="mt-2 text-heading-lg font-semibold text-text-primary">Trang này không còn mở trong Tử Vi Tarot</h1>
        <p className="mt-3 text-body-sm leading-relaxed text-text-secondary">
          Đường dẫn có thể đã được chuyển về trải nghiệm chính, hoặc là một khu vực chưa có dữ liệu thật để hiển thị.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-insight px-4 font-semibold text-canvas hover:bg-[#E2C27C] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-insight"
        >
          Về trang chính
        </Link>
      </section>
    </main>
  );
}
