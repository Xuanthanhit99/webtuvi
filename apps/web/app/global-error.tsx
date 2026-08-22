'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { ErrorState } from '@/components/ui/error-state';
import '@/styles/globals.css';

/**
 * Sprint 12 — the one missing root-level error boundary (Sprint 12 audit §36). Next.js requires
 * `global-error.tsx` to render its own complete `<html>`/`<body>` — it replaces the root layout
 * entirely (fonts, providers, `globals.css`'s own import) when the root layout itself throws, so
 * this file imports `globals.css` directly rather than relying on `app/layout.tsx`. Deliberately
 * does not use `AuthProvider`/`QueryProvider` — if the root layout crashed, those providers (or
 * their dependencies) may be the cause, so this boundary must not depend on them.
 *
 * Mirrors `app/error.tsx`'s existing presentation (`ErrorState`, same copy tone) rather than
 * inventing a new look — no redesign, per Sprint 12's own scope discipline. Never shows a stack
 * trace or any technical detail to the user; reports to Sentry only when Sentry is configured
 * (`Sentry.captureException` is a safe no-op otherwise).
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="vi">
      <body>
        <div className="flex min-h-dvh items-center justify-center bg-canvas px-4">
          <div className="w-full max-w-sm">
            <ErrorState
              title="Something went wrong"
              description="Mệnh Vi gặp lỗi ngoài ý muốn. Bạn có thể thử lại hoặc tải lại trang."
              onRetry={reset}
              retryLabel="Try again"
            />
          </div>
        </div>
      </body>
    </html>
  );
}
