import { Suspense } from 'react';
import { createPublicSystemMetadata } from '@/components/marketing/public-system-landing';
import { NatalChartDashboard } from '@/features/natal-chart/components/natal-chart-dashboard';

export const metadata = createPublicSystemMetadata('ban-do-sao');

function NatalChartFallback() {
  return (
    <section
      className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6"
      aria-labelledby="natal-chart-fallback-title"
    >
      <p className="text-caption font-semibold uppercase text-[#8ddbd0]">Bản đồ sao</p>
      <h1 id="natal-chart-fallback-title" className="mt-3 font-serif text-3xl font-semibold text-text-primary">
        Bản đồ sao cá nhân
      </h1>
      <p className="mt-4 max-w-3xl text-body-md text-text-secondary">
        Lập bản đồ sao từ ngày sinh, giờ sinh và nơi sinh để xem Big Three, vị trí hành tinh,
        mười hai nhà và các góc hợp. Các vị trí được tính từ dữ liệu sinh; phần diễn giải được
        trình bày riêng để bạn luôn phân biệt dữ liệu tính toán với nội dung diễn giải.
      </p>
      <p className="mt-3 max-w-3xl text-body-md text-text-secondary">
        Nếu chưa biết giờ sinh, Mệnh Vi vẫn có thể tính các vị trí hành tinh và cung hoàng đạo,
        nhưng sẽ không suy đoán Cung Mọc hay các nhà. Khi có giờ sinh, bản đồ sẽ bổ sung các trục
        và hệ thống nhà để bạn đi từ tổng quan đến từng lớp dữ liệu chi tiết.
      </p>
      <p className="mt-3 max-w-3xl text-body-md text-text-secondary">
        Sau khi lập bản đồ, bạn có thể xem Big Three, vòng bản đồ sao, danh sách hành tinh,
        các nhà, góc hợp, phần luận giải và chi tiết cách tính. Bản đồ đã lưu có thể mở lại
        từ lịch sử mà không cần nhập lại dữ liệu sinh.
      </p>
      <a href="/discover" className="mt-6 inline-flex text-body-sm font-semibold text-[#efb96c] underline-offset-4 hover:underline">
        Khám phá các hệ thống khác trong Mệnh Vi
      </a>
    </section>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<NatalChartFallback />}>
      <NatalChartDashboard />
    </Suspense>
  );
}
