import type { TuViChartStatusValue, TuViPalaceRoleValue } from '@beaconvie/types';
import type { BadgeVariant } from '@/components/ui/badge';

/** Plain-language labels only — never AI wording. */
export const CHART_STATUS_LABELS: Record<TuViChartStatusValue, string> = {
  ACTIVE: 'Đang dùng',
  ARCHIVED: 'Đã lưu trữ',
  DELETED: 'Đã xóa',
};

export const CHART_STATUS_BADGE_VARIANT: Record<TuViChartStatusValue, BadgeVariant> = {
  ACTIVE: 'new',
  ARCHIVED: 'neutral',
  DELETED: 'neutral',
};

/** Mô tả ngắn tiếng Việt cho 12 cung. */
export const PALACE_ROLE_DESCRIPTIONS_VI: Record<TuViPalaceRoleValue, string> = {
  'Mệnh': 'Bản mệnh và nền tảng cá nhân',
  'Phụ Mẫu': 'Cha mẹ và quan hệ với bậc sinh thành',
  'Phúc Đức': 'Phúc phần, nền tảng gia tộc và đời sống tinh thần',
  'Điền Trạch': 'Nhà cửa, nơi ở và tài sản cố định',
  'Quan Lộc': 'Công việc, sự nghiệp và vai trò xã hội',
  'Nô Bộc': 'Bạn bè, đồng nghiệp và các mối quan hệ hỗ trợ',
  'Thiên Di': 'Môi trường bên ngoài, đi lại và tương tác xã hội',
  'Tật Ách': 'Thể trạng và những điều cần lưu ý về sức khỏe',
  'Tài Bạch': 'Tiền bạc, nguồn lực và cách quản lý tài chính',
  'Tử Tức': 'Con cái và mối quan hệ với thế hệ sau',
  'Phu Thê': 'Hôn nhân và quan hệ bạn đời',
  'Huynh Đệ': 'Anh chị em và quan hệ ngang hàng',
};

/** Short-form badge labels for the 5 Miếu/Vượng/Đắc/Bình hòa/Hãm dignity states — the "địa" suffix
 * is dropped for compact display next to a star name (matches how printed lá số charts abbreviate
 * them), full term still used in aria-labels/trust copy. */
export const DIGNITY_SHORT_LABEL: Record<string, string> = {
  'Miếu địa': 'Miếu',
  'Vượng địa': 'Vượng',
  'Đắc địa': 'Đắc',
  'Bình hòa': 'Bình hòa',
  'Hãm địa': 'Hãm',
};

export const TRANSFORMATION_DESCRIPTIONS_VI: Record<string, string> = {
  'Hóa Lộc': 'Chủ đề về nguồn lực và sự thuận lợi',
  'Hóa Quyền': 'Chủ đề về quyền chủ động và ảnh hưởng',
  'Hóa Khoa': 'Chủ đề về học hỏi, ghi nhận và danh tiếng',
  'Hóa Kỵ': 'Chủ đề về vướng mắc và điều cần xem xét',
};
