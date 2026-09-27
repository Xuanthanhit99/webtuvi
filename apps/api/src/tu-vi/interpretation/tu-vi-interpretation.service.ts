import { Injectable, Logger } from '@nestjs/common';
import { ProviderOrchestratorService } from '../../companion/providers/provider-orchestrator.service';
import { SafetyService } from '../../companion/safety/safety.service';
import { CostControlService } from '../../companion/cost/cost-control.service';
import { ObservabilityService } from '../../companion/observability/observability.service';
import type { AIProviderName, ChatMessage, TokenUsage } from '../../companion/providers/provider.types';
import type { TuViInterpretationInput } from './tu-vi-interpretation.types';

/**
 * Sprint 18B.10 — AI interpretation. Reuses Companion's own provider orchestrator and safety layer
 * exactly, mirroring `EasternHoroscopeInterpretationService`/`NumerologyInterpretationService`
 * rather than standing up a second AI client. Strictly deterministic-chart -> structured fact data
 * -> prompt -> interpretation: this service never decides Mệnh, Thân, Cục, a star's palace, Tuần,
 * Triệt, or a Tứ Hóa target — it only narrates the real, already-persisted chart the deterministic
 * engine (18B.1–18B.8) computed. Non-streaming — no live chat UI to stream into.
 *
 * Unlike Eastern Horoscope's Year Energy (which changes every calendar year), a Tử Vi chart is
 * permanent — there is no "stale, re-interpret for the new year" concept here. `interpretedAt`
 * exists only to record when the (one, permanent) interpretation was generated; retry exists for
 * the case where the first attempt failed (budget/lock/provider issue), not for annual refresh.
 */

const HARD_RULES = `Quy tắc bắt buộc:
- Bạn chỉ nhận các dữ kiện lá số Tử Vi đã được engine xác định trước: Cục, Mệnh, Thân, 14 Chính Tinh, phụ tinh CORE_13, Tuần, Triệt và Tứ Hóa. Không tự tính lại, sửa vị trí, thêm sao hay tạo dữ kiện không có trong đầu vào.
- Không trình bày lá số như dự đoán chắc chắn, định mệnh cố định, điểm may mắn, màu may mắn hoặc con số may mắn. Chỉ diễn giải theo ngữ cảnh truyền thống và hướng tự chiêm nghiệm.
- Không dùng ngôn ngữ gây sợ hãi. Với tổ hợp khó, mô tả mâu thuẫn, điều cần cân nhắc và khả năng phát triển.
- Không đưa ra kết luận chắc chắn về y tế, pháp lý hoặc tài chính.
- Nếu có tham chiếu ký ức, chỉ dùng khi thực sự liên quan và không được tạo thêm ký ức.
- Kết thúc bằng đúng một câu hỏi mở để người đọc tự suy ngẫm.
- TOÀN BỘ câu trả lời phải bằng tiếng Việt tự nhiên. Không viết tiêu đề, nhãn, câu dẫn hoặc đoạn giải thích bằng tiếng Anh. Chỉ giữ nguyên tên riêng/ký hiệu kỹ thuật nếu đầu vào bắt buộc có.`;

const FREE_SYSTEM_PROMPT = `Bạn là lớp diễn giải cho tính năng Tử Vi Đẩu Số của Mệnh Vi.

${HARD_RULES}
- Viết ngắn gọn, rõ ràng, khoảng 120–180 từ; tập trung Mệnh, Thân, Cục và các chính tinh nổi bật, không cần luận lần lượt toàn bộ 12 cung.`;

const PREMIUM_SYSTEM_PROMPT = `Bạn là lớp diễn giải chuyên sâu cho tính năng Tử Vi Đẩu Số của Mệnh Vi.

${HARD_RULES}
- Đi sâu hơn bản cơ bản: kết nối Mệnh, Thân, Cục với chính tinh và phụ tinh đáng chú ý; đề cập Tuần, Triệt và Tứ Hóa khi phù hợp; nếu có tham chiếu ký ức thì chỉ kết nối nhẹ nhàng khi thực sự liên quan.
- Giữ giọng văn bình tĩnh, dễ hiểu và súc tích, khoảng 220–350 từ.`;

const MAX_TOKENS_BY_TIER = { FREE: 450, PREMIUM: 800 } as const;

function buildUserMessage(input: TuViInterpretationInput): string {
  const lines: string[] = [];
  lines.push(`Giới tính: ${input.sex}. Cục: ${input.cuc}. Cung Mệnh tại: ${input.menhPosition}. Cung Thân tại: ${input.thanPosition}. Can Chi năm sinh: ${input.yearStem} ${input.yearBranch}.`);
  lines.push(`14 Chính Tinh và vị trí: ${input.mainStars.map((s) => `${s.star} tại ${s.position}`).join(', ')}.`);
  lines.push(`Các phụ tinh CORE_13 và vị trí: ${input.auxiliaryStars.map((s) => `${s.star} tại ${s.position}`).join(', ')}.`);
  lines.push(`Tuần tại: ${input.tuan.first}, ${input.tuan.second}. Triệt tại: ${input.triet.first}, ${input.triet.second}.`);
  lines.push(`Tứ Hóa: ${input.transformations.map((t) => `${t.transformation} → ${t.targetStar} tại ${t.position}`).join(', ')}.`);
  if (input.memoryReference) {
    lines.push(`Một điều người dùng từng chia sẻ, chỉ nhắc đến nếu thực sự liên quan: "${input.memoryReference.title}" — ${input.memoryReference.summary}`);
  }
  lines.push('Hãy viết phần luận giải ngay bây giờ, chỉ dựa trên các dữ kiện ở trên và chỉ dùng tiếng Việt.');
  return lines.join('\n');
}

@Injectable()
export class TuViInterpretationService {
  private readonly logger = new Logger('TuViInterpretation');

  constructor(
    private readonly orchestrator: ProviderOrchestratorService,
    private readonly safety: SafetyService,
    private readonly costControl: CostControlService,
    private readonly observability: ObservabilityService,
  ) {}

  async interpret(input: TuViInterpretationInput, attribution: { userId: string; sourceId: string }): Promise<string | null> {
    const messages: ChatMessage[] = [
      { role: 'system', content: input.tier === 'PREMIUM' ? PREMIUM_SYSTEM_PROMPT : FREE_SYSTEM_PROMPT },
      { role: 'user', content: buildUserMessage(input) },
    ];

    let content = '';
    let usage: TokenUsage | null = null;
    let model = '';
    let provider: AIProviderName | null = null;
    try {
      for await (const chunk of this.orchestrator.stream(
        messages,
        { maxTokens: MAX_TOKENS_BY_TIER[input.tier], temperature: 0.7 },
        { feature: 'tu_vi', sourceId: attribution.sourceId },
      )) {
        if (chunk.type === 'token') content += chunk.content;
        if (chunk.type === 'done') {
          usage = chunk.usage;
          model = chunk.model;
          provider = chunk.provider;
        }
        if (chunk.type === 'error') {
          this.logger.warn(`Tử Vi interpretation provider error: code=${chunk.code ?? 'unknown'}`);
          return null;
        }
      }
    } catch (error) {
      this.logger.warn(`Tử Vi interpretation failed: ${error instanceof Error ? error.message : 'unknown error'}`);
      return null;
    }

    if (!content.trim()) return null;

    const outputCheck = this.safety.checkOutput(content);
    const result = outputCheck.allowed ? content.trim() : (outputCheck.refusalMessage ?? null);
    if (!outputCheck.allowed) {
      this.logger.warn(`Tử Vi interpretation output refused: category=${outputCheck.category}`);
    }

    if (usage && provider) {
      const estimatedCostUsd = await this.costControl.record({
        userId: attribution.userId,
        feature: 'tu_vi',
        sourceId: attribution.sourceId,
        provider,
        model,
        promptTokens: usage.promptTokens,
        completionTokens: usage.completionTokens,
      });
      this.observability.logUsage({
        userId: attribution.userId,
        feature: 'tu_vi',
        sourceId: attribution.sourceId,
        provider,
        model,
        promptTokens: usage.promptTokens,
        completionTokens: usage.completionTokens,
        estimatedCostUsd,
      });
    }

    return result;
  }
}
