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
          title="Đã có lỗi xảy ra"
          description="Trang này gặp lỗi ngoài ý muốn. Bạn có thể thử lại, hoặc quay về trang chính."
          onRetry={reset}
        />
      </div>
    </div>
  );
}
