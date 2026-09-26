import { NUMEROLOGY_VALUE_TYPES, type NumerologyValueType } from './numerology-engine';

export const NUMEROLOGY_MEANINGS_VERSION = 'numerology-meanings-v2-vi';

const CORE_NUMBER_MEANINGS: Record<number, { title: string; meaning: string }> = {
  1: { title: 'Người Tiên Phong', meaning: 'Tính độc lập, chủ động và xu hướng tự mở lối thay vì đi theo người khác.' },
  2: { title: 'Người Kết Nối', meaning: 'Khả năng hợp tác, sự tinh tế và thiên hướng tạo cân bằng trong các mối quan hệ.' },
  3: { title: 'Người Biểu Đạt', meaning: 'Sức sáng tạo, tinh thần lạc quan và khả năng thể hiện bản thân một cách cởi mở.' },
  4: { title: 'Người Kiến Tạo', meaning: 'Tính kỷ luật, cấu trúc và cách tiếp cận thực tế để xây dựng những giá trị bền vững.' },
  5: { title: 'Tinh Thần Tự Do', meaning: 'Khả năng thích nghi, nhu cầu thay đổi và sự thôi thúc khám phá những trải nghiệm mới.' },
  6: { title: 'Người Chăm Sóc', meaning: 'Tinh thần trách nhiệm, sự nuôi dưỡng và sự quan tâm đến gia đình, cộng đồng và việc phụng sự.' },
  7: { title: 'Người Tìm Kiếm', meaning: 'Xu hướng hướng nội, phân tích và mong muốn hiểu sâu những điều nằm sau bề mặt.' },
  8: { title: 'Người Thành Tựu', meaning: 'Tham vọng, năng lực tổ chức và thiên hướng biến mục tiêu thực tế thành kết quả.' },
  9: { title: 'Người Nhân Ái', meaning: 'Lòng trắc ẩn, tinh thần hoàn thiện và sự quan tâm rộng mở đến người khác.' },
  11: { title: 'Người Trực Giác · Số đặc biệt', meaning: 'Trực giác và cảm hứng được khuếch đại; đây là biểu hiện mạnh và đòi hỏi sự cân bằng cao hơn của số 2.' },
  22: { title: 'Bậc Thầy Kiến Tạo · Số đặc biệt', meaning: 'Khả năng biến tầm nhìn lớn thành kết quả thực tế và bền vững; đây là biểu hiện mạnh hơn của số 4.' },
  33: { title: 'Bậc Thầy Phụng Sự · Số đặc biệt', meaning: 'Lòng trắc ẩn và tinh thần phụng sự được mở rộng; đây là biểu hiện mạnh hơn của số 6.' },
};

const TYPE_FRAMING: Record<NumerologyValueType, string> = {
  LIFE_PATH: 'Số Đường đời phản ánh hướng đi tổng quát và những bài học lớn trong hành trình của bạn.',
  EXPRESSION: 'Số Sứ mệnh phản ánh những năng lực và khuynh hướng tự nhiên thể hiện qua họ tên khai sinh.',
  SOUL_URGE: 'Số Linh hồn phản ánh động lực sâu bên trong và điều bạn thực sự mong muốn.',
  PERSONALITY: 'Số Nhân cách phản ánh ấn tượng bạn thường tạo ra với người khác.',
  BIRTHDAY: 'Số Ngày sinh phản ánh một năng lực riêng hỗ trợ cho hành trình Đường đời.',
  PERSONAL_YEAR: 'Số Năm cá nhân phản ánh chủ đề nổi bật của năm dương lịch hiện tại.',
};

export interface NumerologyMeaning {
  type: NumerologyValueType;
  value: number;
  isMasterNumber: boolean;
  title: string;
  framing: string;
  meaning: string;
}

const MASTER_VALUES = new Set([11, 22, 33]);
const ALL_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33];

export function listNumerologyMeanings(): NumerologyMeaning[] {
  const meanings: NumerologyMeaning[] = [];
  for (const type of NUMEROLOGY_VALUE_TYPES) {
    for (const value of ALL_VALUES) {
      const core = CORE_NUMBER_MEANINGS[value]!;
      meanings.push({ type, value, isMasterNumber: MASTER_VALUES.has(value), title: core.title, framing: TYPE_FRAMING[type], meaning: core.meaning });
    }
  }
  return meanings;
}

export function getNumerologyMeaning(type: NumerologyValueType, value: number): NumerologyMeaning | null {
  const core = CORE_NUMBER_MEANINGS[value];
  if (!core) return null;
  return { type, value, isMasterNumber: MASTER_VALUES.has(value), title: core.title, framing: TYPE_FRAMING[type], meaning: core.meaning };
}
