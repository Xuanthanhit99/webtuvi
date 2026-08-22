import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';
import { MvPage, MvPageHeader } from '@/components/ui/mv-page';

export const metadata: Metadata = buildMetadata({
  title: 'About',
  description: 'Tử Vi Tarot brings Tử Vi, Tarot, astrology, and numerology into one private modern experience.',
  path: '/about',
});

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-content px-4 py-16 desktop:px-8">
      <MvPage>
        <MvPageHeader
          eyebrow="Về Tử Vi Tarot"
          title="Một không gian hiện đại để hiểu mình qua nhiều hệ quy chiếu"
          description="Tử Vi Tarot kết hợp Tử Vi, Tarot, Bản đồ sao và Thần số học trong một trải nghiệm riêng tư, có kiểm soát và không dùng dữ liệu giả để tạo cảm giác cá nhân hóa."
        />
        <p className="max-w-reading text-body-md leading-relaxed text-text-secondary">
          Các kết quả cốt lõi đến từ những engine và API hiện có: rút Tarot thật, tính thần số học thật,
          bản đồ sao thật và lá số Tử Vi thật. AI, khi có, chỉ dùng để giải thích hoặc phản chiếu trên
          kết quả đã được tính trước đó.
        </p>
      </MvPage>
    </main>
  );
}
