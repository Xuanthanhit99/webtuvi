import { NotebookText } from 'lucide-react';
import { MvComingSoon } from '@/features/menh-vi/components/mv-coming-soon';

export default function NhatKyVanMenhPage() {
  return (
    <MvComingSoon
      icon={NotebookText}
      title="Nhật ký vận mệnh"
      description="Lịch sử các lá bài, lá số và những khoảnh khắc bạn đã lưu lại sẽ sớm xuất hiện tại đây."
    />
  );
}
