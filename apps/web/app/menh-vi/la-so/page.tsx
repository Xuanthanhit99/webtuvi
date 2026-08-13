import { ScrollText } from 'lucide-react';
import { MvComingSoon } from '@/features/menh-vi/components/mv-coming-soon';

export default function LaSoPage() {
  return (
    <MvComingSoon
      icon={ScrollText}
      title="Tử Vi Lá Số"
      description="Lá số 12 cung của bạn đang được chuẩn bị — bức tranh vận mệnh của riêng bạn sẽ sớm xuất hiện ở đây."
    />
  );
}
