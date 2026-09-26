import type {
  NatalAspectTypeValue,
  NatalChartHistoryActionValue,
  NatalChartPlanetValue,
  NatalChartStatusValue,
  NatalZodiacSignValue,
} from '@beaconvie/types';
import type { BadgeVariant } from '@/components/ui/badge';
import type { NatalChartInterpretationSectionKey } from './natal-chart.types';

/** Plain, fixed labels only — never AI wording. See docs/architecture/natal-chart-discovery.md. */
export const PLANET_LABELS: Record<NatalChartPlanetValue, string> = {
  sun: 'Mặt Trời',
  moon: 'Mặt Trăng',
  mercury: 'Sao Thủy',
  venus: 'Sao Kim',
  mars: 'Sao Hỏa',
  jupiter: 'Sao Mộc',
  saturn: 'Sao Thổ',
  uranus: 'Sao Thiên Vương',
  neptune: 'Sao Hải Vương',
  pluto: 'Sao Diêm Vương',
};

export const PLANET_GLYPHS: Record<NatalChartPlanetValue, string> = {
  sun: '☉',
  moon: '☽',
  mercury: '☿',
  venus: '♀',
  mars: '♂',
  jupiter: '♃',
  saturn: '♄',
  uranus: '♅',
  neptune: '♆',
  pluto: '♇',
};

/** Sun -> Pluto, the fixed classical display order — matches backend `NatalPlacement.order`. */
export const PLANET_ORDER: NatalChartPlanetValue[] = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];

export const SIGN_LABELS: Record<NatalZodiacSignValue, string> = {
  aries: 'Bạch Dương',
  taurus: 'Kim Ngưu',
  gemini: 'Song Tử',
  cancer: 'Cự Giải',
  leo: 'Sư Tử',
  virgo: 'Xử Nữ',
  libra: 'Thiên Bình',
  scorpio: 'Bọ Cạp',
  sagittarius: 'Nhân Mã',
  capricorn: 'Ma Kết',
  aquarius: 'Bảo Bình',
  pisces: 'Song Ngư',
};

export const SIGN_GLYPHS: Record<NatalZodiacSignValue, string> = {
  aries: '♈',
  taurus: '♉',
  gemini: '♊',
  cancer: '♋',
  leo: '♌',
  virgo: '♍',
  libra: '♎',
  scorpio: '♏',
  sagittarius: '♐',
  capricorn: '♑',
  aquarius: '♒',
  pisces: '♓',
};

/** Aries -> Pisces, zodiac order — used for the wheel's fixed 12-sign ring. */
export const SIGN_ORDER: NatalZodiacSignValue[] = [
  'aries',
  'taurus',
  'gemini',
  'cancer',
  'leo',
  'virgo',
  'libra',
  'scorpio',
  'sagittarius',
  'capricorn',
  'aquarius',
  'pisces',
];

export const ASPECT_TYPE_LABELS: Record<NatalAspectTypeValue, string> = {
  conjunction: 'Trùng tụ',
  opposition: 'Đối đỉnh',
  trine: 'Tam hợp',
  square: 'Vuông góc',
  sextile: 'Lục hợp',
};

/** Harmonious vs. tense framing only for the wheel's aspect-line color — never implies a
 * "good/bad" judgment in any user-facing copy (Module 13 §11: no manipulation, no anxiety
 * framing). */
export const ASPECT_TYPE_LINE_STYLE: Record<NatalAspectTypeValue, 'harmonious' | 'tense' | 'neutral'> = {
  conjunction: 'neutral',
  trine: 'harmonious',
  sextile: 'harmonious',
  square: 'tense',
  opposition: 'tense',
};

export function houseLabel(n: number): string {
  return `Nhà ${n}`;
}

export const CHART_STATUS_LABELS: Record<NatalChartStatusValue, string> = {
  ACTIVE: 'Đang dùng',
  ARCHIVED: 'Đã lưu trữ',
  DELETED: 'Đã xóa',
};

export const CHART_STATUS_BADGE_VARIANT: Record<NatalChartStatusValue, BadgeVariant> = {
  ACTIVE: 'insight',
  ARCHIVED: 'neutral',
  DELETED: 'neutral',
};

export const HISTORY_ACTION_LABELS: Record<NatalChartHistoryActionValue, string> = {
  CREATED: 'Đã lập bản đồ',
  VIEWED: 'Đã xem',
  INTERPRETED: 'Đã tạo diễn giải AI',
  ARCHIVED: 'Đã lưu trữ',
  RESTORED: 'Đã khôi phục',
  DELETED: 'Đã xóa',
};

/** Overview -> ... -> Key Aspects, the progressive-disclosure order (Product Bible Module 13 §4),
 * matching the backend's fixed section keys exactly. */
export const INTERPRETATION_SECTION_ORDER: NatalChartInterpretationSectionKey[] = [
  'overview',
  'corePersonality',
  'emotionalWorld',
  'communication',
  'loveAndRelationships',
  'motivation',
  'careerDirection',
  'strengths',
  'challenges',
  'keyAspects',
];

export const INTERPRETATION_SECTION_LABELS: Record<NatalChartInterpretationSectionKey, string> = {
  overview: 'Tổng quan',
  corePersonality: 'Tính cách cốt lõi',
  emotionalWorld: 'Thế giới cảm xúc',
  communication: 'Giao tiếp',
  loveAndRelationships: 'Tình yêu & các mối quan hệ',
  motivation: 'Động lực',
  careerDirection: 'Sự nghiệp & định hướng',
  strengths: 'Điểm mạnh',
  challenges: 'Thử thách',
  keyAspects: 'Các góc hợp chính',
};
