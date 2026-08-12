import { HeartPulse } from 'lucide-react';
import { MvComingSoon } from '@/features/menh-vi/components/mv-coming-soon';

export default function SucKhoePage() {
  return (
    <MvComingSoon
      icon={HeartPulse}
      title="Sức khỏe"
      description="Góc nhìn về sức khỏe và năng lượng cơ thể của bạn sẽ sớm xuất hiện tại đây."
    />
  );
}
