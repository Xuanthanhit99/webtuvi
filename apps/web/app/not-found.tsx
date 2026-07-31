import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-canvas px-4 text-center">
      <h1 className="font-display text-heading-lg text-text-primary">Page not found</h1>
      <p className="max-w-sm text-body-sm text-text-secondary">
        The page you&rsquo;re looking for doesn&rsquo;t exist, or may have moved.
      </p>
      <Link
        href="/"
        className="inline-flex h-11 items-center justify-center rounded-md bg-insight px-4 font-semibold text-canvas hover:bg-[#E2C27C] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-insight"
      >
        Back to home
      </Link>
    </div>
  );
}
