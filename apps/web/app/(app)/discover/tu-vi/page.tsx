import Link from 'next/link';
import { Suspense } from 'react';

import { createPublicSystemMetadata } from '@/components/marketing/public-system-landing';
import { TuViDashboard } from '@/features/tu-vi/components/tu-vi-dashboard';

export const metadata = createPublicSystemMetadata('tu-vi');

function TuViCrawlerFallback() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-semibold">Lá số Tử Vi Đẩu Số</h1>
      <p className="mt-4 max-w-3xl text-sm leading-7">
        Lập lá số Tử Vi từ ngày, giờ và thông tin sinh để xem tổng quan mệnh bàn, bản đồ 12 cung,
        các sao chính và phần luận giải theo từng cung. Mệnh Vi trình bày dữ liệu an sao theo quy
        tắc xác định, sau đó tách riêng phần diễn giải để bạn có thể đối chiếu nguồn dữ liệu với
        nội dung tham khảo.
      </p>
      <p className="mt-3 max-w-3xl text-sm leading-7">
        Sau khi lập lá số, bạn có thể đi từ tổng quan đến từng cung, xem Đại Vận, Tiểu Hạn, Tứ Hóa,
        Tuần/Triệt và dữ liệu kỹ thuật của lá số. Công cụ không thay đổi kết quả an sao dựa trên
        phần diễn giải và luôn giữ dữ liệu lá số làm nền tảng cho trải nghiệm đọc sâu hơn.
      </p>
      <Link className="mt-6 inline-flex underline underline-offset-4" href="/discover">
        Khám phá các hệ của Mệnh Vi
      </Link>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<TuViCrawlerFallback />}>
      <TuViDashboard />
    </Suspense>
  );
}
