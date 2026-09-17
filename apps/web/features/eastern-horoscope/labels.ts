import type { EasternHoroscopeProfileStatusValue, YearEnergyRelationshipValue } from '@beaconvie/types';
import type { BadgeVariant } from '@/components/ui/badge';

/** Plain-language labels only — never AI wording. See docs/reference/web-tu-vi/web-tu-vi/14-eastern-horoscope-experience.md. */
export const PROFILE_STATUS_LABELS: Record<EasternHoroscopeProfileStatusValue, string> = {
  ACTIVE: 'Đang lưu',
  ARCHIVED: 'Đã lưu trữ',
  DELETED: 'Đã xóa',
};

export const PROFILE_STATUS_BADGE_VARIANT: Record<EasternHoroscopeProfileStatusValue, BadgeVariant> = {
  ACTIVE: 'new',
  ARCHIVED: 'neutral',
  DELETED: 'neutral',
};

/** Thematic, non-predictive framing only — this product hard-rejects luck-scoring/fortune-telling
 * copy (Bible Module 14 §11). */
export const YEAR_ENERGY_RELATIONSHIP_LABELS: Record<YearEnergyRelationshipValue, string> = {
  GENERATES: 'Ngũ hành của năm nay sinh dưỡng cho ngũ hành của bạn — một giai đoạn có thể nâng đỡ sự phát triển bền vững.',
  IS_GENERATED_BY: 'Ngũ hành của bạn nuôi dưỡng cho ngũ hành của năm nay — một giai đoạn có thể đòi hỏi nhiều hơn ở nội lực của bạn.',
  CONTROLS: 'Ngũ hành của năm nay chế ngự ngũ hành của bạn — một giai đoạn gợi ý sự kiên nhẫn.',
  IS_CONTROLLED_BY: 'Ngũ hành của bạn chế ngự ngũ hành của năm nay — một giai đoạn mà sự vững vàng của bạn có thể nổi bật.',
  SAME: 'Năm nay cùng ngũ hành với bạn — một giai đoạn nhịp điệu quen thuộc.',
};

export const ELEMENT_LABELS_EN: Record<string, string> = {
  Mộc: 'Wood',
  Hỏa: 'Fire',
  Thổ: 'Earth',
  Kim: 'Metal',
  Thủy: 'Water',
};

export const YIN_YANG_LABELS_EN: Record<string, string> = {
  Dương: 'Yang',
  Âm: 'Yin',
};
