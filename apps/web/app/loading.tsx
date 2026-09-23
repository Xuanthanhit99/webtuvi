import { Skeleton } from '@/components/ui/skeleton';

export default function RootLoading() {
  return (
    <main className="mx-auto w-full max-w-[1536px] px-4 py-6 tablet:px-6 desktop:px-8" aria-busy="true" aria-label="Đang tải nội dung">
      <div className="space-y-5">
        <Skeleton className="h-7 w-36 rounded-md" />
        <Skeleton className="h-[clamp(18rem,42vw,34rem)] w-full rounded-2xl" />
        <div className="grid grid-cols-2 gap-4 desktop:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="space-y-3 rounded-xl border border-white/10 p-3">
              <Skeleton className="aspect-[4/3] w-full rounded-lg" />
              <Skeleton className="h-5 w-2/3 rounded" />
              <Skeleton className="h-4 w-full rounded" />
            </div>
          ))}
        </div>
      </div>
      <span className="sr-only">Đang tải Mệnh Vi…</span>
    </main>
  );
}
