import { Compass } from 'lucide-react';
import { MvComingSoon } from '@/features/menh-vi/components/mv-coming-soon';

export default function KhamPhaPage() {
  return (
    <MvComingSoon
      icon={Compass}
      title="Khám phá"
      description="Nơi tổng hợp mọi góc nhìn về vận mệnh của bạn — đang được xây dựng."
    />
  );
}
