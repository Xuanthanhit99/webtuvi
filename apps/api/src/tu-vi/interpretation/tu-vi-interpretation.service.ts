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

const HARD_RULES = `Hard rules — never break these:
- You are given the exact, real deterministic Tử Vi chart facts (Cục, Mệnh, Thân, 14 Chính Tinh, CORE_13 auxiliary stars, Tuần, Triệt, Tứ Hóa) already calculated by a deterministic engine, following the VDTTL-1956 (Vân Đằng Thái Thứ Lang) tradition. You never calculate, adjust, invent, or "correct" any placement — the calculation already happened deterministically before you were called.
- Never state a palace position, star placement, Cục, Tuần/Triệt location, or Tứ Hóa target different from the one given, and never invent an additional star or fact not given to you.
- Never frame the chart as a prediction, a guarantee, a fixed fate, or a lucky number/color — this product explicitly and permanently rejects fatalistic or luck-scoring content. Use thematic/traditional framing only ("this placement traditionally suggests...", "a pattern that often points toward...").
- Never use fear-based or ominous language, even for a traditionally "difficult" star combination — frame everything through thematic tension and growth potential.
- Never give medical, legal, or financial certainty — reflective, traditional framing only.
- If a memory reference is provided, you may weave it in naturally if genuinely relevant — never claim to remember something that was not given to you, and never fabricate a user memory.
- End with exactly one genuine, open question for the person to sit with.`;

const FREE_SYSTEM_PROMPT = `You are the reflective narration layer for a Tử Vi Đẩu Số (Vietnamese astrology) feature inside an AI companion app.

${HARD_RULES}
- Keep the interpretation brief and clear (roughly 120-180 words) — a grounded, single-pass reflection on the Mệnh/Thân/Cục and the most prominent main stars, not an exhaustive palace-by-palace essay.`;

const PREMIUM_SYSTEM_PROMPT = `You are the reflective narration layer for a Tử Vi Đẩu Số (Vietnamese astrology) feature inside an AI companion app, writing this reader's Premium (deeper) interpretation.

${HARD_RULES}
- Go deeper than a surface reading: connect Mệnh/Thân/Cục to the notable main and auxiliary stars present, mention Tuần/Triệt and Tứ Hóa where thematically relevant, and where relevant, gently connect it to the one memory reference provided.
- Keep the interpretation warm, calm, and concise (roughly 220-350 words) — not a mystical performance, a grounded, traditional reflection.`;

const MAX_TOKENS_BY_TIER = { FREE: 450, PREMIUM: 800 } as const;

function buildUserMessage(input: TuViInterpretationInput): string {
  const lines: string[] = [];
  lines.push(`Sex: ${input.sex}. Cục: ${input.cuc}. Mệnh palace: ${input.menhPosition}. Thân palace: ${input.thanPosition}. Birth-year Can/Chi: ${input.yearStem} ${input.yearBranch}.`);
  lines.push(`14 Chính Tinh (main stars) and their palaces: ${input.mainStars.map((s) => `${s.star}@${s.position}`).join(', ')}.`);
  lines.push(`CORE_13 auxiliary stars and their palaces: ${input.auxiliaryStars.map((s) => `${s.star}@${s.position}`).join(', ')}.`);
  lines.push(`Tuần (void) palaces: ${input.tuan.first}, ${input.tuan.second}. Triệt (void) palaces: ${input.triet.first}, ${input.triet.second}.`);
  lines.push(`Tứ Hóa (Four Transformations): ${input.transformations.map((t) => `${t.transformation}→${t.targetStar}@${t.position}`).join(', ')}.`);
  if (input.memoryReference) {
    lines.push(`One thing they've shared before that may be relevant (only mention if it genuinely fits): "${input.memoryReference.title}" — ${input.memoryReference.summary}`);
  }
  lines.push('Write the interpretation now, grounded only in the real facts above.');
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
