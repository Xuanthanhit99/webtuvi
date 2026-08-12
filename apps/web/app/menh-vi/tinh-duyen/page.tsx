import { Heart } from 'lucide-react';
import { MvComingSoon } from '@/features/menh-vi/components/mv-coming-soon';

export default function TinhDuyenPage() {
  return (
    <MvComingSoon
      icon={Heart}
      title="Tình duyên"
      description="Góc nhìn về tình cảm và các mối quan hệ của bạn sẽ sớm xuất hiện tại đây."
    />
  );
}
