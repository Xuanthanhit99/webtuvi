import { ProgressCircular } from '@/components/ui/progress';

export default function RootLoading() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas">
      <ProgressCircular label="Loading…" />
    </div>
  );
}
