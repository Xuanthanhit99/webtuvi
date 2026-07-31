'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/ui/error-state';

export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-sm">
        <ErrorState
          title="Something went wrong"
          description="This page hit an unexpected error. You can try again, or head back home."
          onRetry={reset}
        />
      </div>
    </div>
  );
}
