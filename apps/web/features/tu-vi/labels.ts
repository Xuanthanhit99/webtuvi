import type { TuViChartStatusValue, TuViPalaceRoleValue } from '@beaconvie/types';
import type { BadgeVariant } from '@/components/ui/badge';

/** Plain-language labels only — never AI wording. */
export const CHART_STATUS_LABELS: Record<TuViChartStatusValue, string> = {
  ACTIVE: 'Active',
  ARCHIVED: 'Archived',
  DELETED: 'Deleted',
};

export const CHART_STATUS_BADGE_VARIANT: Record<TuViChartStatusValue, BadgeVariant> = {
  ACTIVE: 'new',
  ARCHIVED: 'neutral',
  DELETED: 'neutral',
};

/** English glosses shown alongside the Vietnamese palace name — never a replacement for it, since
 * the Vietnamese term is the canonical one this product's readers expect. */
export const PALACE_ROLE_LABELS_EN: Record<TuViPalaceRoleValue, string> = {
  'Mệnh': 'Life / Destiny',
  'Phụ Mẫu': 'Parents',
  'Phúc Đức': 'Fortune / Virtue',
  'Điền Trạch': 'Property',
  'Quan Lộc': 'Career',
  'Nô Bộc': 'Friends / Associates',
  'Thiên Di': 'Travel',
  'Tật Ách': 'Health',
  'Tài Bạch': 'Wealth',
  'Tử Tức': 'Children',
  'Phu Thê': 'Spouse / Partner',
  'Huynh Đệ': 'Siblings',
};

export const TRANSFORMATION_LABELS_EN: Record<string, string> = {
  'Hóa Lộc': 'Transformation of Fortune',
  'Hóa Quyền': 'Transformation of Power',
  'Hóa Khoa': 'Transformation of Reputation',
  'Hóa Kỵ': 'Transformation of Adversity',
};
