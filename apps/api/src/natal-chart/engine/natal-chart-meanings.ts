import type { NatalChartPlanetKey } from './natal-chart-constants';
import type { NatalAspectTypeKey, NatalZodiacSignKey } from './natal-chart-calculator.service';

export const NATAL_CHART_MEANINGS_VERSION = 'natal-chart-meanings-v2-vi';

export interface NatalMeaningEntry { title: string; meaning: string; }

const PLANET_MEANINGS: Record<NatalChartPlanetKey, NatalMeaningEntry> = {
  sun: { title: 'Mặt Trời', meaning: 'bản sắc cốt lõi, sức sống và hình ảnh bản thân bạn đang chủ động phát triển' },
  moon: { title: 'Mặt Trăng', meaning: 'đời sống cảm xúc, phản ứng bản năng và những điều tạo cảm giác an toàn' },
  mercury: { title: 'Sao Thủy', meaning: 'giao tiếp, cách tư duy và cách bạn tiếp nhận rồi truyền đạt thông tin' },
  venus: { title: 'Sao Kim', meaning: 'sự hấp dẫn, hệ giá trị và những điều bạn cảm thấy đẹp hoặc đáng theo đuổi' },
  mars: { title: 'Sao Hỏa', meaning: 'động lực, tính quyết đoán và cách bạn hành động hoặc bảo vệ quan điểm' },
  jupiter: { title: 'Sao Mộc', meaning: 'sự phát triển, tinh thần lạc quan và nơi bạn có xu hướng mở rộng trải nghiệm' },
  saturn: { title: 'Sao Thổ', meaning: 'cấu trúc, trách nhiệm và nơi kỷ luật gắn với thành quả dài hạn' },
  uranus: { title: 'Sao Thiên Vương', meaning: 'tính độc đáo, sự đổi mới và nơi bạn có xu hướng phá vỡ khuôn mẫu' },
  neptune: { title: 'Sao Hải Vương', meaning: 'trí tưởng tượng, lý tưởng và nơi các ranh giới có xu hướng trở nên mềm hơn' },
  pluto: { title: 'Sao Diêm Vương', meaning: 'sự chuyển hóa, chiều sâu và nơi những thay đổi mạnh mẽ thường diễn ra' },
};

const SIGN_MEANINGS: Record<NatalZodiacSignKey, NatalMeaningEntry> = {
  aries: { title: 'Bạch Dương', meaning: 'trực tiếp, chủ động và nhanh chóng bắt tay vào hành động' },
  taurus: { title: 'Kim Ngưu', meaning: 'ổn định, thực tế và coi trọng sự nhất quán' },
  gemini: { title: 'Song Tử', meaning: 'tò mò, linh hoạt và thích sự đa dạng trong giao tiếp' },
  cancer: { title: 'Cự Giải', meaning: 'giàu tính bảo bọc, nhạy cảm và hướng về cảm giác thuộc về' },
  leo: { title: 'Sư Tử', meaning: 'ấm áp, giàu biểu đạt và mong muốn được nhìn nhận chân thành' },
  virgo: { title: 'Xử Nữ', meaning: 'chú ý chi tiết, thực tế và hướng đến việc cải thiện điều hữu ích' },
  libra: { title: 'Thiên Bình', meaning: 'coi trọng quan hệ, sự cân bằng, công bằng và hài hòa' },
  scorpio: { title: 'Bọ Cạp', meaning: 'sâu sắc, mạnh mẽ và có xu hướng tìm hiểu điều nằm dưới bề mặt' },
  sagittarius: { title: 'Nhân Mã', meaning: 'ưa khám phá, lạc quan và hướng đến bức tranh lớn hơn' },
  capricorn: { title: 'Ma Kết', meaning: 'tham vọng, kỷ luật và hướng đến thành tựu dài hạn' },
  aquarius: { title: 'Bảo Bình', meaning: 'độc lập, thiên về ý tưởng và cởi mở với điều khác biệt' },
  pisces: { title: 'Song Ngư', meaning: 'giàu tưởng tượng, đồng cảm và nhạy với những điều khó nắm bắt' },
};

const HOUSE_MEANINGS: Record<number, NatalMeaningEntry> = {
  1: { title: 'Nhà 1', meaning: 'bản thân, ấn tượng ban đầu và cách bạn bước vào thế giới' },
  2: { title: 'Nhà 2', meaning: 'tiền bạc, tài sản và cảm nhận về giá trị cá nhân' },
  3: { title: 'Nhà 3', meaning: 'giao tiếp, học hỏi và các kết nối thường ngày' },
  4: { title: 'Nhà 4', meaning: 'gia đình, mái ấm và cảm giác về cội nguồn' },
  5: { title: 'Nhà 5', meaning: 'sáng tạo, tình cảm lãng mạn và sự thể hiện bản thân' },
  6: { title: 'Nhà 6', meaning: 'thói quen hằng ngày, sức khỏe và việc phụng sự thực tế' },
  7: { title: 'Nhà 7', meaning: 'quan hệ đối tác và những kết nối một-một gần gũi' },
  8: { title: 'Nhà 8', meaning: 'nguồn lực chung, sự thân mật và chuyển hóa' },
  9: { title: 'Nhà 9', meaning: 'niềm tin, học hỏi chuyên sâu và những chân trời rộng hơn' },
  10: { title: 'Nhà 10', meaning: 'sự nghiệp, đời sống công chúng và danh tiếng' },
  11: { title: 'Nhà 11', meaning: 'cộng đồng, tình bạn và những kỳ vọng cho tương lai' },
  12: { title: 'Nhà 12', meaning: 'thế giới nội tâm, nghỉ ngơi và những điều riêng tư' },
};

const ASPECT_MEANINGS: Record<NatalAspectTypeKey, NatalMeaningEntry> = {
  conjunction: { title: 'Trùng tụ', meaning: 'hai nguồn năng lượng hòa vào nhau và hoạt động như một lực kết hợp' },
  opposition: { title: 'Đối đỉnh', meaning: 'hai nguồn năng lượng kéo theo hai hướng khác nhau và cần được cân bằng' },
  trine: { title: 'Tam hợp', meaning: 'hai nguồn năng lượng phối hợp tự nhiên và hỗ trợ nhau tương đối thuận lợi' },
  square: { title: 'Vuông góc', meaning: 'hai nguồn năng lượng tạo ma sát, thường thúc đẩy việc điều chỉnh và phát triển' },
  sextile: { title: 'Lục hợp', meaning: 'hai nguồn năng lượng tạo cơ hội hỗ trợ khi bạn chủ động khai thác' },
};

const ANGLE_LABELS: Record<'ascendant' | 'midheaven', string> = { ascendant: 'Cung Mọc', midheaven: 'Thiên Đỉnh' };

export function planetMeaning(body: NatalChartPlanetKey): NatalMeaningEntry { return PLANET_MEANINGS[body]; }
export function signMeaning(sign: NatalZodiacSignKey): NatalMeaningEntry { return SIGN_MEANINGS[sign]; }
export function houseMeaning(houseNumber: number): NatalMeaningEntry {
  const entry = HOUSE_MEANINGS[houseNumber];
  if (!entry) throw new Error(`Không có diễn giải cố định cho Nhà ${houseNumber}; giá trị hợp lệ là 1–12.`);
  return entry;
}
export function aspectTypeMeaning(type: NatalAspectTypeKey): NatalMeaningEntry { return ASPECT_MEANINGS[type]; }

export function composePlacementMeaning(body: NatalChartPlanetKey, sign: NatalZodiacSignKey, house: number | null): string {
  const planet = planetMeaning(body); const signEntry = signMeaning(sign);
  const base = `${planet.title} (${planet.meaning}) ở ${signEntry.title} (${signEntry.meaning})`;
  if (house === null) return base;
  const houseEntry = houseMeaning(house);
  return `${base} — ${houseEntry.title} (${houseEntry.meaning})`;
}
export function composeAngleMeaning(angle: 'ascendant' | 'midheaven', sign: NatalZodiacSignKey): string {
  const signEntry = signMeaning(sign);
  return `${ANGLE_LABELS[angle]} ở ${signEntry.title} (${signEntry.meaning})`;
}
const POINT_LABELS: Record<string, string> = {
  ...Object.fromEntries(Object.entries(PLANET_MEANINGS).map(([key, value]) => [key, value.title])),
  ascendant: ANGLE_LABELS.ascendant, midheaven: ANGLE_LABELS.midheaven,
};
export function pointLabel(point: string): string { return POINT_LABELS[point] ?? point; }
export function composeAspectMeaning(pointA: string, pointB: string, type: NatalAspectTypeKey): string {
  const aspect = aspectTypeMeaning(type);
  return `${pointLabel(pointA)} ${aspect.title} ${pointLabel(pointB)} — ${aspect.meaning}`;
}
/** Kept for the stable API/test contract; UI labels houses in Vietnamese. */
export function houseOrdinal(n: number): string { return `Nhà ${n}`; }
