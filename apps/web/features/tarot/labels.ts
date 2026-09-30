import type { TarotReadingStatusValue, TarotReadingTypeValue, TarotSuitValue } from '@beaconvie/types';
import type { BadgeVariant } from '@/components/ui/badge';

/** Plain-language labels only — never AI wording. See docs/architecture/tarot-discovery.md. */
export const READING_TYPE_LABELS: Record<TarotReadingTypeValue, string> = {
  DAILY_DRAW: 'Lá bài hôm nay',
  SINGLE_CARD: 'Một lá soi chiếu',
  THREE_CARD: 'Ba lá theo dòng thời gian',
};

export const READING_TYPE_DESCRIPTIONS: Record<TarotReadingTypeValue, string> = {
  DAILY_DRAW: 'Một lá dành cho hôm nay. Mỗi ngày chỉ rút một lần để giữ trọn khoảnh khắc soi chiếu.',
  SINGLE_CARD: 'Một lá cho điều đang khiến bạn bận tâm ngay lúc này.',
  THREE_CARD: 'Ba lá — Quá khứ, Hiện tại, Tương lai — để nhìn câu chuyện theo một dòng liền mạch.',
};

export const READING_STATUS_LABELS: Record<TarotReadingStatusValue, string> = {
  ACTIVE: 'Đang lưu',
  ARCHIVED: 'Đã lưu trữ',
  DELETED: 'Đã xóa',
};

export const READING_STATUS_BADGE_VARIANT: Record<TarotReadingStatusValue, BadgeVariant> = {
  ACTIVE: 'new',
  ARCHIVED: 'neutral',
  DELETED: 'neutral',
};

export const SUIT_LABELS: Record<TarotSuitValue, string> = {
  WANDS: 'Gậy',
  CUPS: 'Cốc',
  SWORDS: 'Kiếm',
  PENTACLES: 'Tiền',
};
