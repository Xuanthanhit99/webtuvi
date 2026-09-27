/**
 * Vietnamese editorial layer for the canonical 78-card Tarot deck.
 *
 * This module deliberately derives every entry from TAROT_DECK rather than defining a second
 * deck. Slug, identity, arcana, suit, number, image and engine data remain owned by tarot-deck.ts.
 * The layer only localizes explanatory copy used by Vietnamese public knowledge pages.
 */

import { TAROT_DECK, type TarotCardSeed } from './tarot-deck';

export interface TarotSeoViContent {
  uprightKeywords: string[];
  uprightMeaning: string;
  reversedKeywords: string[];
  reversedMeaning: string;
  reflectionPrompts: string[];
  loveMeaning: string;
  careerMeaning: string;
  financeMeaning: string;
  selfMeaning: string;
}

const suitContext: Record<Exclude<TarotCardSeed['suit'], null>, string> = {
  WANDS: 'động lực, hành động và sức sáng tạo',
  CUPS: 'cảm xúc, trực giác và các mối quan hệ',
  SWORDS: 'suy nghĩ, giao tiếp và những quyết định khó',
  PENTACLES: 'công việc, nguồn lực và sự ổn định thực tế',
};

const majorContext: Record<number, string> = {
  0:'một khởi đầu mới và sự cởi mở trước điều chưa biết',1:'khả năng biến ý định thành hành động',2:'trực giác và điều chưa được nói thành lời',3:'sự nuôi dưỡng, sáng tạo và phát triển',4:'cấu trúc, kỷ luật và khả năng làm chủ',5:'giá trị truyền thống, học hỏi và sự dẫn dắt',6:'tình yêu, sự hòa hợp và lựa chọn theo giá trị',7:'ý chí, định hướng và khả năng tiến về phía trước',8:'sức mạnh nội tâm, kiên nhẫn và lòng trắc ẩn',9:'chiêm nghiệm, khoảng lặng và sự dẫn đường từ bên trong',10:'chu kỳ thay đổi và một bước ngoặt tự nhiên',11:'sự công bằng, trách nhiệm và hệ quả của lựa chọn',12:'tạm dừng, buông bớt và nhìn vấn đề từ góc khác',13:'một kết thúc cần thiết để mở đường cho chuyển hóa',14:'sự điều hòa, tiết chế và tìm lại cân bằng',15:'sự ràng buộc, ham muốn và những khuôn mẫu khó buông',16:'một cấu trúc cũ bị phá vỡ để sự thật lộ ra',17:'hy vọng, hồi phục và niềm tin vào hướng đi phía trước',18:'sự mơ hồ, trực giác và những nỗi sợ chưa được soi rõ',19:'niềm vui, sức sống và sự sáng tỏ',20:'tự đánh giá, thức tỉnh và lời gọi thay đổi',21:'sự hoàn tất, trọn vẹn và khép lại một chu kỳ',
};

const rankContext: Record<number, string> = {
  1:'một hạt giống hoặc cơ hội mới đang hình thành',2:'hai hướng cần được cân nhắc và giữ cân bằng',3:'sự phát triển thông qua kết nối hoặc mở rộng',4:'nhu cầu tạo nền tảng và giữ sự ổn định',5:'một thử thách làm lộ ra điều cần điều chỉnh',6:'sự dịch chuyển theo hướng cân bằng và tiến triển',7:'một giai đoạn đánh giá, thử thách hoặc giữ vững lập trường',8:'năng lượng đang được tập trung để tạo chuyển động rõ hơn',9:'một chặng gần hoàn tất, nơi kinh nghiệm cá nhân trở nên quan trọng',10:'điểm kết của một chu kỳ trước khi bước sang giai đoạn khác',11:'tinh thần học hỏi, quan sát và thử nghiệm',12:'năng lượng chủ động đang tìm cách tiến về phía trước',13:'sự trưởng thành, thấu hiểu và khả năng nâng đỡ',14:'khả năng làm chủ, định hướng và chịu trách nhiệm',
};

const keywordVi: Record<string,string> = {
  'new beginnings':'khởi đầu mới','spontaneity':'tự nhiên','innocence':'cởi mở','a leap of faith':'bước đi bằng niềm tin','free spirit':'tinh thần tự do',
  'manifestation':'hiện thực hóa','resourcefulness':'khéo xoay xở','willpower':'ý chí','inspired action':'hành động có cảm hứng',
  'intuition':'trực giác','mystery':'bí ẩn','the subconscious':'tiềm thức','inner knowing':'sự hiểu biết bên trong','stillness':'tĩnh lặng',
  'love':'tình yêu','harmony':'hòa hợp','change':'thay đổi','growth':'phát triển','success':'thành công','career':'sự nghiệp','money':'tài chính',
  'conflict':'xung đột','balance':'cân bằng','stability':'ổn định','leadership':'dẫn dắt','creativity':'sáng tạo','hope':'hy vọng',
  'new opportunity':'cơ hội mới','security':'an toàn','patience':'kiên nhẫn','independence':'độc lập','completion':'hoàn tất',
  'authority':'quyền chủ động','structure':'cấu trúc','discipline':'kỷ luật','courage':'can đảm','compassion':'lòng trắc ẩn',
  'planning':'lập kế hoạch','future vision':'tầm nhìn tương lai','confidence':'tự tin','recognition':'được ghi nhận','resilience':'bền bỉ',
  'burden':'gánh nặng','responsibility':'trách nhiệm','exploration':'khám phá','enthusiasm':'nhiệt huyết','vision':'tầm nhìn',
  'new love':'tình cảm mới','emotional beginning':'khởi đầu cảm xúc','emotional block':'bế tắc cảm xúc','clarity':'sáng tỏ',
  'truth':'sự thật','fairness':'công bằng','abundance':'sung túc','generosity':'hào phóng','collaboration':'hợp tác',
  'mastery':'thành thạo','dedication':'tận tâm','recovery':'hồi phục','uncertainty':'bất định','transformation':'chuyển hóa',
};

function viKeywords(words: string[], reversed = false): string[] {
  return words.map((word) => keywordVi[word.toLowerCase()] ?? (reversed ? `mặt cần xem lại: ${word}` : `chủ đề: ${word}`));
}

function context(card: TarotCardSeed): string {
  if (card.arcana === 'MAJOR') return majorContext[card.number] ?? 'một bài học lớn trong hành trình cá nhân';
  return `${rankContext[card.number]}; trọng tâm của bộ bài là ${card.suit ? suitContext[card.suit] : 'trải nghiệm đời sống'}`;
}

function build(card: TarotCardSeed): TarotSeoViContent {
  const ctx = context(card);
  return {
    uprightKeywords: viKeywords(card.uprightKeywords),
    uprightMeaning: `Ở chiều xuôi, ${card.nameVi} gợi đến ${ctx}. Lá bài khuyến khích bạn quan sát điều đang thực sự diễn ra, nhận ra nguồn lực mình có và chọn một bước đi phù hợp thay vì cố tìm một lời tiên đoán chắc chắn.`,
    reversedKeywords: viKeywords(card.reversedKeywords, true),
    reversedMeaning: `Ở chiều ngược, ${card.nameVi} cho thấy chủ đề ${ctx} có thể đang bị trì hoãn, mất cân bằng hoặc biểu hiện theo cách khó nhận ra. Đây là tín hiệu để xem lại giả định, giới hạn và cách phản ứng trước khi quyết định bước tiếp theo.`,
    reflectionPrompts: [
      `Trong hoàn cảnh hiện tại, ${ctx} đang xuất hiện rõ nhất ở đâu?`,
      `Điều gì bạn có thể nhìn lại hoặc điều chỉnh sau khi rút ${card.nameVi}?`,
      `Nếu không xem lá bài như một dự đoán, thông điệp nào của ${card.nameVi} hữu ích nhất cho quyết định của bạn lúc này?`,
    ],
    loveMeaning: `Trong tình yêu và các mối quan hệ, ${card.nameVi} hướng sự chú ý tới ${ctx}. Hãy đối chiếu thông điệp này với hành vi, giao tiếp và nhu cầu thực tế của cả hai thay vì suy diễn ý định của người khác.`,
    careerMeaning: `Với công việc và sự nghiệp, ${card.nameVi} đặt trọng tâm vào ${ctx}. Đây là lúc xem lại mục tiêu, nguồn lực và bước hành động cụ thể mà bạn có thể kiểm soát.`,
    financeMeaning: `Ở khía cạnh tài chính, ${card.nameVi} gợi ý nhìn ${ctx} dưới góc độ thực tế. Tarot không thay thế dữ liệu tài chính; hãy dùng lá bài như câu hỏi phản tư rồi kiểm tra lại bằng ngân sách, rủi ro và thông tin có thể xác minh.`,
    selfMeaning: `Với bản thân, ${card.nameVi} mời bạn suy ngẫm về ${ctx}. Giá trị của lá bài nằm ở việc giúp gọi tên điều đang trải qua và mở thêm một góc nhìn, không phải quyết định thay bạn.`,
  };
}

export const TAROT_SEO_VI: Readonly<Record<string, TarotSeoViContent>> = Object.freeze(
  Object.fromEntries(TAROT_DECK.map((card) => [card.slug, build(card)])),
);

if (Object.keys(TAROT_SEO_VI).length !== 78) throw new Error('TAROT_SEO_VI must cover exactly 78 canonical cards.');

export function tarotSeoVi(card: TarotCardSeed): TarotSeoViContent {
  const content = TAROT_SEO_VI[card.slug];
  if (!content) throw new Error(`Missing Vietnamese Tarot SEO content for ${card.slug}.`);
  return content;
}
