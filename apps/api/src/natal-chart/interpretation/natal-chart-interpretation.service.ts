import { Injectable, Logger } from '@nestjs/common';
import { ProviderOrchestratorService } from '../../companion/providers/provider-orchestrator.service';
import { SafetyService } from '../../companion/safety/safety.service';
import { CostControlService } from '../../companion/cost/cost-control.service';
import { ObservabilityService } from '../../companion/observability/observability.service';
import type { AIProviderName, ChatMessage, TokenUsage } from '../../companion/providers/provider.types';
import { NATAL_CHART_INTERPRETATION_MAX_TOKENS } from '../engine/natal-chart-constants';
import { NATAL_CHART_INTERPRETATION_SECTIONS, type NatalChartInterpretationInput, type NatalChartInterpretationSections } from '../natal-chart.types';

const HARD_RULES = `Hard rules — never break these:
- You are given the exact, real chart placements already calculated by a deterministic astronomical/astrological engine, plus their fixed traditional meanings. You never calculate, adjust, invent, or "correct" a placement, sign, house, or aspect — the calculation already happened deterministically before you were called.
- Never invent a placement, house, or aspect that was not given to you, and never state a fact that contradicts what was given.
- Use tendency/potential language only — "this placement often shows up as...", "you might notice a pull toward...". Never declarative, fixed-trait language like "you are..." or "you will always...".
- Never predict a future event.
- Never present a placement as a flat stereotype (e.g. never "you're a Gemini so you're scattered") — always frame it as one tendency among many, personally worth checking against how the person actually experiences things.
- Never frame a "difficult" aspect or placement as a diagnosis, flaw, or something to fix — frame it as a tension worth being aware of.
- End every section with exactly one genuine, open question inviting the person's own account — never more than one, never zero.
- If a memory reference is provided, you may weave it in naturally if genuinely relevant — never claim to remember something that was not given to you. Never fabricate a user memory.
- Respond with strict JSON only — no markdown code fences, no commentary before or after the JSON object.`;

const SECTION_LIST = NATAL_CHART_INTERPRETATION_SECTIONS.join(', ');

const FREE_SYSTEM_PROMPT = `You are the reflective narration layer for a Natal Chart Discovery feature inside an AI companion app.

${HARD_RULES}
- Write a JSON object with exactly these keys, each a string: ${SECTION_LIST}.
- Keep each section brief (roughly 40-70 words) — grounded, single-pass reflections, not essays.`;

const PREMIUM_SYSTEM_PROMPT = `You are the reflective narration layer for a Natal Chart Discovery feature inside an AI companion app, writing this reader's Premium (deeper) interpretation.

${HARD_RULES}
- Write a JSON object with exactly these keys, each a string: ${SECTION_LIST}.
- Go deeper than a surface reading: note thematic connections across the placements given, and where relevant, gently connect the interpretation to the one memory reference provided.
- Keep each section warm, calm, and concise (roughly 70-110 words) — not a mystical performance, a grounded reflection.`;

function describePlacements(input: NatalChartInterpretationInput): string {
  return input.placements.map((p) => `- ${p.meaning}${p.retrograde ? ' (retrograde)' : ''}`).join('\n');
}

function buildUserMessage(input: NatalChartInterpretationInput): string {
  const lines: string[] = [];
  lines.push('Real, already-calculated chart facts:');
  lines.push(describePlacements(input));
  if (input.ascendant) lines.push(`- Ascendant (Rising Sign): ${input.ascendant.meaning}`);
  if (input.midheaven) lines.push(`- Midheaven: ${input.midheaven.meaning}`);
  if (!input.housesAvailable) {
    lines.push('- Houses and Ascendant/Midheaven are unavailable for this chart (birth time unknown, or an extreme birth latitude) — never invent or guess them.');
  }
  if (input.keyAspects.length > 0) {
    lines.push('Key aspects (most exact first):');
    for (const aspect of input.keyAspects) lines.push(`- ${aspect.meaning} (orb ${aspect.orb.toFixed(1)}°)`);
  } else {
    lines.push('No major aspects to note.');
  }
  lines.push(`Birth place: "${input.birthPlaceLabel}".`);
  if (input.memoryReference) {
    lines.push(`One thing they've shared before that may be relevant (only mention if it genuinely fits): "${input.memoryReference.title}" — ${input.memoryReference.summary}`);
  }
  lines.push('Write the interpretation now, grounded only in the real facts above.');
  return lines.join('\n');
}

function stripCodeFence(text: string): string {
  const trimmed = text.trim();
  const fenced = /^```(?:json)?\s*([\s\S]*?)\s*```$/.exec(trimmed);
  return fenced ? fenced[1]! : trimmed;
}

function parseSections(raw: string): NatalChartInterpretationSections | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripCodeFence(raw));
  } catch {
    return null;
  }
  if (typeof parsed !== 'object' || parsed === null) return null;

  const record = parsed as Record<string, unknown>;
  const result = {} as NatalChartInterpretationSections;
  for (const key of NATAL_CHART_INTERPRETATION_SECTIONS) {
    const value = record[key];
    if (typeof value !== 'string' || value.trim() === '') return null;
    result[key] = value.trim();
  }
  return result;
}

/**
 * Phase 10/11 — AI interpretation. Reuses Companion's own provider orchestrator and safety layer
 * exactly (no second AI client), mirroring `NumerologyInterpretationService`/
 * `TarotInterpretationService`. Strictly deterministic-calculation -> structured chart facts ->
 * prompt -> structured interpretation: this service never decides what a placement is, only
 * narrates the real result it's handed, and only ever writes to the `interpretation` JSON column
 * — it has no access to (and cannot mutate) `NatalPlacement`/`NatalHouse`/`NatalAspect` rows.
 *
 * Sprint 12 — plays the same role as `TarotInterpretationService`/`NumerologyInterpretationService`:
 * forwards `feature`/`sourceId` attribution to the orchestrator and records `AIUsage` once a real
 * provider call completes, regardless of whether the output was ultimately safety-refused or
 * failed structured-JSON parsing — a real token cost was incurred either way (Natal Chart prompts
 * are the largest of the three surfaces, so this attribution matters most here). Budget check and
 * the concurrency lock live one layer up in `NatalChartRecordService` (mirrors Tarot/Numerology's
 * own split exactly).
 */
@Injectable()
export class NatalChartInterpretationService {
  private readonly logger = new Logger('NatalChartInterpretation');

  constructor(
    private readonly orchestrator: ProviderOrchestratorService,
    private readonly safety: SafetyService,
    private readonly costControl: CostControlService,
    private readonly observability: ObservabilityService,
  ) {}

  async interpret(
    input: NatalChartInterpretationInput,
    attribution: { userId: string; sourceId: string },
  ): Promise<NatalChartInterpretationSections | null> {
    // Mirrors NumerologyInterpretationService's own `checkInput()` call exactly — `birthPlaceLabel`
    // is the one piece of this feature's free text that traces back to user-influenced input (the
    // search query that produced it), so it gets the same crisis/prompt-injection screening before
    // being embedded in the prompt.
    const inputCheck = this.safety.checkInput(input.birthPlaceLabel);
    if (!inputCheck.allowed) {
      this.logger.warn(`Natal Chart interpretation input refused: category=${inputCheck.category}`);
      return null;
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
        { maxTokens: NATAL_CHART_INTERPRETATION_MAX_TOKENS[input.tier], temperature: 0.7 },
        { feature: 'natal_chart', sourceId: attribution.sourceId },
      )) {
        if (chunk.type === 'token') content += chunk.content;
        if (chunk.type === 'done') {
          usage = chunk.usage;
          model = chunk.model;
          provider = chunk.provider;
        }
        if (chunk.type === 'error') {
          this.logger.warn(`Natal Chart interpretation provider error: code=${chunk.code ?? 'unknown'}`);
          return null;
        }
      }
    } catch (error) {
      this.logger.warn(`Natal Chart interpretation failed: ${error instanceof Error ? error.message : 'unknown error'}`);
      return null;
    }

    let sections: NatalChartInterpretationSections | null = null;
    if (content.trim()) {
      const outputCheck = this.safety.checkOutput(content);
      if (!outputCheck.allowed) {
        this.logger.warn(`Natal Chart interpretation output refused: category=${outputCheck.category}`);
      } else {
        sections = parseSections(content);
        if (!sections) this.logger.warn('Natal Chart interpretation output was not valid structured JSON — discarding.');
      }
    }

    // A real provider call completed (we reached a `done` chunk) — record the actual cost
    // incurred regardless of whether the output was ultimately usable (safety-refused or failed
    // JSON parsing still cost real tokens).
    if (usage && provider) {
      const estimatedCostUsd = await this.costControl.record({
        userId: attribution.userId,
        feature: 'natal_chart',
        sourceId: attribution.sourceId,
        provider,
        model,
        promptTokens: usage.promptTokens,
        completionTokens: usage.completionTokens,
      });
      this.observability.logUsage({
        userId: attribution.userId,
        feature: 'natal_chart',
        sourceId: attribution.sourceId,
        provider,
        model,
        promptTokens: usage.promptTokens,
        completionTokens: usage.completionTokens,
        estimatedCostUsd,
      });
    }

    return sections;
  }
}
