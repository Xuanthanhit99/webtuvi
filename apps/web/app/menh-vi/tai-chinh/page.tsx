import { Coins } from 'lucide-react';
import { MvComingSoon } from '@/features/menh-vi/components/mv-coming-soon';

export default function TaiChinhPage() {
  return (
    <MvComingSoon
      icon={Coins}
      title="Tài chính"
      description="Góc nhìn về tài lộc và cơ hội tài chính của bạn sẽ sớm xuất hiện tại đây."
    />
  );
}
