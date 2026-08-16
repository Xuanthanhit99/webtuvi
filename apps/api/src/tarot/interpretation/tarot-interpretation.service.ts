import { Injectable, Logger } from '@nestjs/common';
import { ProviderOrchestratorService } from '../../companion/providers/provider-orchestrator.service';
import { SafetyService } from '../../companion/safety/safety.service';
import { CostControlService } from '../../companion/cost/cost-control.service';
import { ObservabilityService } from '../../companion/observability/observability.service';
import type { AIProviderName, ChatMessage, TokenUsage } from '../../companion/providers/provider.types';
import type { InterpretationInput } from '../tarot.types';

const HARD_RULES = `Hard rules — never break these:
- You are given the exact, real card(s) already drawn, their real upright/reversed orientation, and their real traditional meanings. You never choose, change, add, or remove a card — the draw already happened deterministically before you were called.
- Never invent a card that was not given to you. Never claim a card is reversed if it was given to you as upright, or vice versa.
- Speak in reflective, possibility-framed language — never state a prediction as a fact ("this will happen"), always frame it as something to consider or notice.
- If a memory reference is provided, you may weave it in naturally if genuinely relevant — never claim to remember something that was not given to you.
- Never fabricate a user memory — if none is provided, do not invent one.`;

// Sprint 7 — Premium interpretation gating (Phase 13 of the sprint brief). The hard rules above are
// identical for both tiers: Premium is never allowed to choose cards, change orientation, fabricate
// draws, or fabricate memories — only the narration's depth and (for Premium) memory personalization
// differ. See docs/architecture/premium-entitlements.md "AI interpretation gating".
const FREE_SYSTEM_PROMPT = `You are the reflective narration layer for a Tarot reading feature inside an AI companion app.

${HARD_RULES}
- Keep the interpretation brief and clear (roughly 80-140 words) — a grounded, single-pass reflection, not an essay.
- End with one genuine, open question for the person to sit with.`;

const PREMIUM_SYSTEM_PROMPT = `You are the reflective narration layer for a Tarot reading feature inside an AI companion app, writing this reader's Premium (deeper) interpretation.

${HARD_RULES}
- Go deeper than a surface reading: note thematic connections between the cards (if more than one), and where relevant, gently connect the reading to the one memory reference provided.
- Keep the interpretation warm, calm, and concise (roughly 150-260 words) — not a mystical performance, a grounded reflection.
- End with one genuine, open question for the person to sit with.`;

const MAX_TOKENS_BY_TIER = { FREE: 400, PREMIUM: 700 } as const;

function describeCard(card: InterpretationInput['cards'][number]): string {
  const orientation = card.isReversed ? 'reversed' : 'upright';
  const meaning = card.isReversed ? card.card.reversedMeaning : card.card.uprightMeaning;
  const keywords = (card.isReversed ? card.card.reversedKeywords : card.card.uprightKeywords).join(', ');
  const position = card.positionLabel ? `${card.positionLabel} — ` : '';
  return `${position}${card.card.name} (${orientation}). Traditional meaning: ${meaning} Keywords: ${keywords}.`;
}

function buildUserMessage(input: InterpretationInput): string {
  const lines: string[] = [];
  lines.push(`Reading type: ${input.readingType.replace('_', ' ').toLowerCase()}.`);
  if (input.question) lines.push(`Their question: "${input.question}"`);
  lines.push('Real cards drawn, in order:');
  for (const card of input.cards) lines.push(`- ${describeCard(card)}`);
  if (input.memoryReference) {
    lines.push(`One thing they've shared before that may be relevant (only mention if it genuinely fits): "${input.memoryReference.title}" — ${input.memoryReference.summary}`);
  }
  lines.push('Write the interpretation now, grounded only in the real cards above.');
  return lines.join('\n');
}

/**
 * Phase 4 — AI interpretation. Reuses Companion's own provider orchestrator and safety layer
 * exactly (see companion.module.ts's Sprint 6 export note) rather than standing up a second AI
 * client. The pipeline is strictly deterministic-draw -> structured card data -> prompt ->
 * interpretation: this service never decides which cards were drawn, only narrates the real
 * result it's handed. Non-streaming (a single buffered call) — Tarot has no live chat UI to
 * stream into, unlike Companion's own conversation flow.
 *
 * Sprint 12 — plays the same role Companion's `StreamService` plays for its own generation:
 * forwards `feature`/`sourceId` attribution to the orchestrator (so `ProviderLog` rows are
 * attributable) and records `AIUsage` via `CostControlService.record()` once a real provider call
 * completes, regardless of whether the output was ultimately safety-refused — a real token cost
 * was incurred either way. Budget checking and the concurrency lock live one layer up, in
 * `TarotRecordService`, which owns the retry-vs-draw call sites (mirrors `ConversationService`
 * owning the budget check while `StreamService` owns the lock/recording for Companion).
 */
@Injectable()
export class TarotInterpretationService {
  private readonly logger = new Logger('TarotInterpretation');

  constructor(
    private readonly orchestrator: ProviderOrchestratorService,
    private readonly safety: SafetyService,
    private readonly costControl: CostControlService,
    private readonly observability: ObservabilityService,
  ) {}

  async interpret(input: InterpretationInput, attribution: { userId: string; sourceId: string }): Promise<string | null> {
    if (input.question) {
      const inputCheck = this.safety.checkInput(input.question);
      if (!inputCheck.allowed) {
        this.logger.warn(`Tarot interpretation input refused: category=${inputCheck.category}`);
        return inputCheck.refusalMessage ?? null;
      }
    }

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
        { feature: 'tarot', sourceId: attribution.sourceId },
      )) {
        if (chunk.type === 'token') content += chunk.content;
        if (chunk.type === 'done') {
          usage = chunk.usage;
          model = chunk.model;
          provider = chunk.provider;
        }
        if (chunk.type === 'error') {
          this.logger.warn(`Tarot interpretation provider error: code=${chunk.code ?? 'unknown'}`);
          return null;
        }
      }
    } catch (error) {
      this.logger.warn(`Tarot interpretation failed: ${error instanceof Error ? error.message : 'unknown error'}`);
      return null;
    }

    if (!content.trim()) return null;

    const outputCheck = this.safety.checkOutput(content);
    const result = outputCheck.allowed ? content.trim() : (outputCheck.refusalMessage ?? null);
    if (!outputCheck.allowed) {
      this.logger.warn(`Tarot interpretation output refused: category=${outputCheck.category}`);
    }

    // A real provider call completed (we reached a `done` chunk) — record the actual cost
    // incurred regardless of whether the output was ultimately safety-refused. Never fabricated:
    // only recorded when `usage`/`provider` came from a genuine `done` chunk above.
    if (usage && provider) {
      const estimatedCostUsd = await this.costControl.record({
        userId: attribution.userId,
        feature: 'tarot',
        sourceId: attribution.sourceId,
        provider,
        model,
        promptTokens: usage.promptTokens,
        completionTokens: usage.completionTokens,
      });
      this.observability.logUsage({
        userId: attribution.userId,
        feature: 'tarot',
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
