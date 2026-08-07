import { Injectable, Logger } from '@nestjs/common';
import { ProviderOrchestratorService } from '../../companion/providers/provider-orchestrator.service';
import { SafetyService } from '../../companion/safety/safety.service';
import type { ChatMessage } from '../../companion/providers/provider.types';
import type { InterpretationInput } from '../tarot.types';

const SYSTEM_PROMPT = `You are the reflective narration layer for a Tarot reading feature inside an AI companion app.

Hard rules — never break these:
- You are given the exact, real card(s) already drawn, their real upright/reversed orientation, and their real traditional meanings. You never choose, change, add, or remove a card — the draw already happened deterministically before you were called.
- Never invent a card that was not given to you. Never claim a card is reversed if it was given to you as upright, or vice versa.
- Speak in reflective, possibility-framed language — never state a prediction as a fact ("this will happen"), always frame it as something to consider or notice.
- If a memory reference is provided, you may weave it in naturally if genuinely relevant — never claim to remember something that was not given to you.
- Keep the interpretation warm, calm, and concise (roughly 120-220 words) — not a mystical performance, a grounded reflection.
- End with one genuine, open question for the person to sit with.`;

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
 */
@Injectable()
export class TarotInterpretationService {
  private readonly logger = new Logger('TarotInterpretation');

  constructor(
    private readonly orchestrator: ProviderOrchestratorService,
    private readonly safety: SafetyService,
  ) {}

  async interpret(input: InterpretationInput): Promise<string | null> {
    if (input.question) {
      const inputCheck = this.safety.checkInput(input.question);
      if (!inputCheck.allowed) {
        this.logger.warn(`Tarot interpretation input refused: category=${inputCheck.category}`);
        return inputCheck.refusalMessage ?? null;
      }
    }

    const messages: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildUserMessage(input) },
    ];

    let content = '';
    try {
      for await (const chunk of this.orchestrator.stream(messages, { maxTokens: 400, temperature: 0.7 })) {
        if (chunk.type === 'token') content += chunk.content;
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
    if (!outputCheck.allowed) {
      this.logger.warn(`Tarot interpretation output refused: category=${outputCheck.category}`);
      return outputCheck.refusalMessage ?? null;
    }

    return content.trim();
  }
}
