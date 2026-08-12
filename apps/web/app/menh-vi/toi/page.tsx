import { User } from 'lucide-react';
import { MvComingSoon } from '@/features/menh-vi/components/mv-coming-soon';

export default function ToiPage() {
  return (
    <MvComingSoon
      icon={User}
      title="Tôi"
      description="Hồ sơ, cài đặt và Mệnh Vi Premium sẽ sớm xuất hiện tại đây."
    />
  );
}
