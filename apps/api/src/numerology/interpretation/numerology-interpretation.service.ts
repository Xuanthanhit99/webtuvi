import { Injectable, Logger } from '@nestjs/common';
import { ProviderOrchestratorService } from '../../companion/providers/provider-orchestrator.service';
import { SafetyService } from '../../companion/safety/safety.service';
import type { ChatMessage } from '../../companion/providers/provider.types';
import { getNumerologyMeaning } from '../engine/numerology-meanings';
import type { InterpretationInput } from '../numerology.types';

const HARD_RULES = `Hard rules — never break these:
- You are given the exact, real core numbers already calculated by a deterministic engine, plus their real traditional meanings. You never calculate, adjust, invent, or "correct" a number — the calculation already happened deterministically before you were called.
- Never invent a core number that was not given to you, and never state a number different from the one given.
- Never claim certainty about future events — frame everything as a pattern to consider or notice, not a prediction.
- If a memory reference is provided, you may weave it in naturally if genuinely relevant — never claim to remember something that was not given to you.
- Never fabricate a user memory — if none is provided, do not invent one.
- Never describe this as a personality "type" or diagnosis — these are traditional numerology patterns to reflect on, not a fixed label for who someone is.`;

// Sprint 8 — same Free/Premium interpretation-depth split as Tarot (Sprint 7): the hard rules above
// are identical for both tiers; only narration depth and (Premium-only) memory personalization
// differ. See docs/architecture/premium-entitlements.md "AI interpretation gating".
const FREE_SYSTEM_PROMPT = `You are the reflective narration layer for a Numerology reading feature inside an AI companion app.

${HARD_RULES}
- Keep the interpretation brief and clear (roughly 100-160 words) — a grounded, single-pass reflection across the numbers given, not an essay on each one.
- End with one genuine, open question for the person to sit with.`;

const PREMIUM_SYSTEM_PROMPT = `You are the reflective narration layer for a Numerology reading feature inside an AI companion app, writing this reader's Premium (deeper) interpretation.

${HARD_RULES}
- Go deeper than a surface reading: note thematic connections between the numbers given, and where relevant, gently connect the reading to the one memory reference provided.
- Keep the interpretation warm, calm, and concise (roughly 180-300 words) — not a mystical performance, a grounded reflection.
- End with one genuine, open question for the person to sit with.`;

const MAX_TOKENS_BY_TIER = { FREE: 400, PREMIUM: 700 } as const;

function describeValue(entry: InterpretationInput['values'][number]): string {
  const meaning = getNumerologyMeaning(entry.type, entry.value);
  const label = entry.type.replace('_', ' ').toLowerCase();
  const masterNote = entry.isMasterNumber ? ' (a Master Number — never reduced further)' : '';
  return `${label}: ${entry.value}${masterNote}. Traditional meaning: ${meaning ? `${meaning.title} — ${meaning.meaning}` : 'n/a'}`;
}

function buildUserMessage(input: InterpretationInput): string {
  const lines: string[] = [];
  lines.push(`Name used for the calculation: "${input.normalizedBirthName}".`);
  lines.push('Real, already-calculated core numbers:');
  for (const value of input.values) lines.push(`- ${describeValue(value)}`);
  if (input.memoryReference) {
    lines.push(`One thing they've shared before that may be relevant (only mention if it genuinely fits): "${input.memoryReference.title}" — ${input.memoryReference.summary}`);
  }
  lines.push('Write the interpretation now, grounded only in the real numbers above.');
  return lines.join('\n');
}

/**
 * Phase 8 — AI interpretation. Reuses Companion's own provider orchestrator and safety layer
 * exactly (see numerology.module.ts's export note), mirroring `TarotInterpretationService`
 * (Sprint 6/7) rather than standing up a second AI client. Strictly deterministic-calculation ->
 * structured number data -> prompt -> interpretation: this service never decides what a core
 * number is, only narrates the real result it's handed. Non-streaming — Numerology has no live
 * chat UI to stream into.
 */
@Injectable()
export class NumerologyInterpretationService {
  private readonly logger = new Logger('NumerologyInterpretation');

  constructor(
    private readonly orchestrator: ProviderOrchestratorService,
    private readonly safety: SafetyService,
  ) {}

  async interpret(input: InterpretationInput): Promise<string | null> {
    // Release-closure audit finding (Phase 8) — `fullBirthName` is user-controlled free text.
    // The DTO regex only restricts the *character set* (letters/marks/space/period/apostrophe/
    // hyphen), not semantic content: phrases like "ignore previous instructions" or "want to die"
    // are composed entirely of allowed characters and would otherwise reach the prompt unchecked.
    // Mirrors TarotInterpretationService's own `checkInput()` call on its free-text `question`
    // field exactly — the same crisis/prompt-injection detectors, applied to this feature's own
    // user-controlled text before it's embedded in the prompt.
    const inputCheck = this.safety.checkInput(input.normalizedBirthName);
    if (!inputCheck.allowed) {
      this.logger.warn(`Numerology interpretation input refused: category=${inputCheck.category}`);
      return inputCheck.refusalMessage ?? null;
    }

    const messages: ChatMessage[] = [
      { role: 'system', content: input.tier === 'PREMIUM' ? PREMIUM_SYSTEM_PROMPT : FREE_SYSTEM_PROMPT },
      { role: 'user', content: buildUserMessage(input) },
    ];

    let content = '';
    try {
      for await (const chunk of this.orchestrator.stream(messages, { maxTokens: MAX_TOKENS_BY_TIER[input.tier], temperature: 0.7 })) {
        if (chunk.type === 'token') content += chunk.content;
        if (chunk.type === 'error') {
          this.logger.warn(`Numerology interpretation provider error: code=${chunk.code ?? 'unknown'}`);
          return null;
        }
      }
    } catch (error) {
      this.logger.warn(`Numerology interpretation failed: ${error instanceof Error ? error.message : 'unknown error'}`);
      return null;
    }

    if (!content.trim()) return null;

    const outputCheck = this.safety.checkOutput(content);
    if (!outputCheck.allowed) {
      this.logger.warn(`Numerology interpretation output refused: category=${outputCheck.category}`);
      return outputCheck.refusalMessage ?? null;
    }

    return content.trim();
  }
}
