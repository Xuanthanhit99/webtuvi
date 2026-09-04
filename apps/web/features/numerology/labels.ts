import type { NumerologyReadingStatusValue, NumerologyValueTypeValue } from '@beaconvie/types';
import type { BadgeVariant } from '@/components/ui/badge';

export const VALUE_TYPE_LABELS: Record<NumerologyValueTypeValue, string> = {
  LIFE_PATH: 'Đường đời', EXPRESSION: 'Sứ mệnh', SOUL_URGE: 'Linh hồn', PERSONALITY: 'Nhân cách', BIRTHDAY: 'Ngày sinh', PERSONAL_YEAR: 'Năm cá nhân',
};

export const VALUE_TYPE_DESCRIPTIONS: Record<NumerologyValueTypeValue, string> = {
  LIFE_PATH: 'Hướng đi và những bài học lớn xuyên suốt cuộc đời bạn.',
  EXPRESSION: 'Năng lực tự nhiên được phản chiếu qua toàn bộ họ tên khai sinh.',
  SOUL_URGE: 'Động lực sâu bên trong, được tính từ các nguyên âm trong tên.',
  PERSONALITY: 'Ấn tượng bạn thường tạo ra, được tính từ các phụ âm trong tên.',
  BIRTHDAY: 'Một năng lực riêng hỗ trợ cho hành trình đường đời.',
  PERSONAL_YEAR: 'Chủ đề nổi bật của năm dương lịch hiện tại.',
};

export const VALUE_TYPE_ORDER: NumerologyValueTypeValue[] = ['LIFE_PATH', 'EXPRESSION', 'SOUL_URGE', 'PERSONALITY', 'BIRTHDAY', 'PERSONAL_YEAR'];
export const READING_STATUS_LABELS: Record<NumerologyReadingStatusValue, string> = { ACTIVE: 'Đang lưu', ARCHIVED: 'Đã lưu trữ', DELETED: 'Đã xóa' };
export const READING_STATUS_BADGE_VARIANT: Record<NumerologyReadingStatusValue, BadgeVariant> = { ACTIVE: 'insight', ARCHIVED: 'neutral', DELETED: 'neutral' };
