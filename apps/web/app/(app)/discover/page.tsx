import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';
import { DiscoverExperience } from './discover-experience';

export const metadata: Metadata = buildMetadata({
  title: 'Khám phá Tử Vi, Tarot, Bản Đồ Sao & Thần Số Học',
  description: 'Bắt đầu từ điều đang khiến bạn bận lòng để chọn Tử Vi, Tarot, Bản Đồ Sao, Thần Số Học hoặc Ngũ Hành phù hợp trong Mệnh Vi.',
  path: '/discover',
});

export default function DiscoverPage() {
  return <DiscoverExperience />;
}
