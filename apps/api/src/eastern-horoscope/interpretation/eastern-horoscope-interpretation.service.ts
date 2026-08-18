import { Injectable, Logger } from '@nestjs/common';
import { ProviderOrchestratorService } from '../../companion/providers/provider-orchestrator.service';
import { SafetyService } from '../../companion/safety/safety.service';
import { CostControlService } from '../../companion/cost/cost-control.service';
import { ObservabilityService } from '../../companion/observability/observability.service';
import type { AIProviderName, ChatMessage, TokenUsage } from '../../companion/providers/provider.types';
import type { InterpretationInput } from '../eastern-horoscope.types';

/**
 * Sprint 17 — AI interpretation. Reuses Companion's own provider orchestrator and safety layer
 * exactly, mirroring `NumerologyInterpretationService`/`TarotInterpretationService` rather than
 * standing up a second AI client. Strictly deterministic-calculation -> structured fact data ->
 * prompt -> interpretation: this service never decides a Stem, Branch, zodiac animal, Element,
 * Yin/Yang, or Year Energy relationship — it only narrates the real result the deterministic
 * engine already computed (`docs/domain/eastern-horoscope-rules.md` §0; Bible Module 14 §6/§17–19).
 * Non-streaming — no live chat UI to stream into.
 */

const HARD_RULES = `Hard rules — never break these:
- You are given the exact, real Stem, Branch, zodiac animal, Element, Yin/Yang, and Year Energy relationship already calculated by a deterministic engine. You never calculate, adjust, invent, or "correct" any of these — the calculation already happened deterministically before you were called.
- Never state a Stem, Branch, animal, Element, Yin/Yang, or Year Energy relationship different from the one given, and never invent an additional astrology fact not given to you.
- Never frame a theme as a prediction, a guarantee, a luck score, or a lucky number/color — this product explicitly and permanently rejects luck-scoring content. Use thematic/quality language only ("this year often favors...", "a period that traditionally invites...").
- Never use fear-based or ominous language, even for a traditionally "challenging" element combination — frame everything through thematic tension and growth potential.
- Never give medical, legal, or financial certainty — reflective framing only.
- If a memory reference is provided, you may weave it in naturally if genuinely relevant — never claim to remember something that was not given to you, and never fabricate a user memory.
- End with exactly one genuine, open question for the person to sit with.`;

const FREE_SYSTEM_PROMPT = `You are the reflective narration layer for an Eastern Horoscope (Chinese Zodiac / Five Elements) feature inside an AI companion app.

${HARD_RULES}
- Keep the interpretation brief and clear (roughly 100-160 words) — a grounded, single-pass reflection on the year's theme, not an essay.`;

const PREMIUM_SYSTEM_PROMPT = `You are the reflective narration layer for an Eastern Horoscope (Chinese Zodiac / Five Elements) feature inside an AI companion app, writing this reader's Premium (deeper) interpretation.

${HARD_RULES}
- Go deeper than a surface reading: connect the year's elemental relationship to the person's own sign, and where relevant, gently connect it to the one memory reference provided.
- Keep the interpretation warm, calm, and concise (roughly 180-300 words) — not a mystical performance, a grounded reflection.`;

const MAX_TOKENS_BY_TIER = { FREE: 400, PREMIUM: 700 } as const;

const RELATIONSHIP_LABEL: Record<InterpretationInput['yearEnergy']['relationship'], string> = {
  GENERATES: 'this year\'s element generates/nurtures your own element',
  IS_GENERATED_BY: 'your own element generates/nurtures this year\'s element',
  CONTROLS: 'this year\'s element controls/restrains your own element',
  IS_CONTROLLED_BY: 'your own element controls/restrains this year\'s element',
  SAME: 'this year shares your own element',
};

function buildUserMessage(input: InterpretationInput): string {
  const lines: string[] = [];
  lines.push(`Person's own sign: ${input.zodiacAnimal.en} (${input.branch}), Element: ${input.element}, Yin/Yang: ${input.yinYang}, Stem: ${input.stem}.`);
  lines.push(
    `Current calendar year (${input.yearEnergy.calendarYear}): ${input.yearEnergy.yearZodiacAnimal.en}, Element: ${input.yearEnergy.yearElement}.`,
  );
  lines.push(`Real, already-calculated Year Energy relationship: ${RELATIONSHIP_LABEL[input.yearEnergy.relationship]}.`);
  if (input.memoryReference) {
    lines.push(`One thing they've shared before that may be relevant (only mention if it genuinely fits): "${input.memoryReference.title}" — ${input.memoryReference.summary}`);
  }
  lines.push('Write the interpretation now, grounded only in the real facts above.');
  return lines.join('\n');
}

@Injectable()
export class EasternHoroscopeInterpretationService {
  private readonly logger = new Logger('EasternHoroscopeInterpretation');

  constructor(
    private readonly orchestrator: ProviderOrchestratorService,
    private readonly safety: SafetyService,
    private readonly costControl: CostControlService,
    private readonly observability: ObservabilityService,
  ) {}

  async interpret(input: InterpretationInput, attribution: { userId: string; sourceId: string }): Promise<string | null> {
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
        { feature: 'eastern_horoscope', sourceId: attribution.sourceId },
      )) {
        if (chunk.type === 'token') content += chunk.content;
        if (chunk.type === 'done') {
          usage = chunk.usage;
          model = chunk.model;
          provider = chunk.provider;
        }
        if (chunk.type === 'error') {
          this.logger.warn(`Eastern Horoscope interpretation provider error: code=${chunk.code ?? 'unknown'}`);
          return null;
        }
      }
    } catch (error) {
      this.logger.warn(`Eastern Horoscope interpretation failed: ${error instanceof Error ? error.message : 'unknown error'}`);
      return null;
    }

    if (!content.trim()) return null;

    const outputCheck = this.safety.checkOutput(content);
    const result = outputCheck.allowed ? content.trim() : (outputCheck.refusalMessage ?? null);
    if (!outputCheck.allowed) {
      this.logger.warn(`Eastern Horoscope interpretation output refused: category=${outputCheck.category}`);
    }

    if (usage && provider) {
      const estimatedCostUsd = await this.costControl.record({
        userId: attribution.userId,
        feature: 'eastern_horoscope',
        sourceId: attribution.sourceId,
        provider,
        model,
        promptTokens: usage.promptTokens,
        completionTokens: usage.completionTokens,
      });
      this.observability.logUsage({
        userId: attribution.userId,
        feature: 'eastern_horoscope',
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
