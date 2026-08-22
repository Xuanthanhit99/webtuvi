import type { Metadata } from 'next';
import Link from 'next/link';
import { Compass, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MvPage, MvPageHeader } from '@/components/ui/mv-page';

export const metadata: Metadata = {
  title: 'Cộng đồng Tử Vi Tarot',
  description: 'Một không gian cộng đồng Tử Vi Tarot đang được hoàn thiện.',
  robots: { index: false, follow: false },
};

export default function CommunityPage() {
  return (
    <MvPage className="mx-auto min-h-[70dvh] max-w-content justify-center px-4 py-10 tablet:px-8">
      <MvPageHeader
        eyebrow="Cộng đồng"
        title="Cộng đồng Tử Vi Tarot"
        description="Một không gian để chia sẻ trải nghiệm, góc nhìn và những câu chuyện của riêng bạn. Tính năng đang được hoàn thiện."
      >
        <Link href="/discover">
          <Button variant="secondary">
            <Compass className="h-4 w-4" aria-hidden="true" />
            Khám phá Tử Vi Tarot
          </Button>
        </Link>
      </MvPageHeader>

      <div className="relative mx-auto flex aspect-square w-40 items-center justify-center rounded-full border border-insight/20 bg-surface">
        <span className="absolute h-24 w-24 rounded-full border border-insight/15" aria-hidden="true" />
        <span className="absolute h-12 w-32 rounded-[50%] border border-trust/20" aria-hidden="true" />
        <Sparkles className="relative h-7 w-7 text-insight" aria-hidden="true" />
      </div>
    </MvPage>
  );
}
