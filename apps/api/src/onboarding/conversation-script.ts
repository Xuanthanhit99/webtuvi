/**
 * Deterministic, rule-based Companion "voice" for Sprint 1 onboarding.
 *
 * IMPORTANT — this is not a language model. Sprint 1 has no AI/LLM provider in
 * scope, so the Companion's replies are templated copy modeled directly on the
 * canonical example script in docs/reference Module 7 §6, with light templating
 * (quoting back a short excerpt of what the user wrote) to avoid feeling
 * completely canned. Real generative replies are explicitly deferred to a later
 * sprint — see docs/architecture/sprint-1-decisions.md.
 */

function excerpt(text: string, maxWords = 8): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return words.join(' ');
  return `${words.slice(0, maxWords).join(' ')}…`;
}

export const OPENING_MESSAGE =
  'Chào bạn, rất vui được gặp bạn. Gần đây bạn đang nghĩ về điều gì, dù chỉ là một chuyện nhỏ?';

export function firstFollowUp(userMessage: string): string {
  const quoted = excerpt(userMessage);
  return `Cảm ơn bạn đã chia sẻ về “${quoted}”. Với bạn, điều khó nhất trong chuyện này là gì?`;
}

/**
 * Asks — rather than asserts — before remembering anything (explicit memory
 * consent, per the Sprint 1 privacy requirement that a user who declines can
 * still complete onboarding with nothing saved).
 */
export function reflectionMessage(): string {
  return 'Bạn có muốn lưu điều này thành ký ức để có thể nhìn lại về sau không? Bạn vẫn có thể tiếp tục nếu không muốn lưu.';
}

export const MEMORY_SAVED_MESSAGE = 'Đã nhận lựa chọn của bạn. Việc lưu ký ức tuân theo quyền ghi nhớ bạn đã thiết lập.';
export const MEMORY_DECLINED_MESSAGE = 'Mình sẽ không lưu điều này thành ký ức. Chúng ta vẫn có thể tiếp tục.';

export function memoryNoteContent(firstUserMessage: string): string {
  return `Ghi nhớ: ${excerpt(firstUserMessage, 20)}`;
}

export const DISCOVERY_OFFER_MESSAGE =
  'Bạn muốn khám phá Tarot, bản đồ sao hoặc thần số học không? Bạn cũng có thể để sau.';

export const DISCOVERY_ACCEPTED_MESSAGE =
  'Bạn có thể bắt đầu khám phá Tarot, bản đồ sao và thần số học khi sẵn sàng.';

export const DISCOVERY_SKIPPED_MESSAGE =
  'Không sao cả. Bạn có thể quay lại khám phá bất cứ lúc nào.';

export const ACTIVATION_MESSAGE =
  'Đã hoàn tất bước làm quen. Chúc bạn tìm thấy điều hữu ích cho mình trên Mệnh Vi.';
