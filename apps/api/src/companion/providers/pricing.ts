import type { AIProviderName } from './provider.types';

/**
 * USD per 1,000 tokens, as of this sprint. These are estimates for cost
 * *tracking*, not a billing source of truth — see docs/architecture/companion-core.md
 * "Cost control". Update when a provider changes pricing; there is no live
 * pricing API call (would add an external dependency + failure mode for a
 * number that changes rarely).
 */
export interface ModelPricing {
  promptPer1k: number;
  completionPer1k: number;
}

const PRICING: Record<AIProviderName, Record<string, ModelPricing>> = {
  openai: {
    'gpt-4o': { promptPer1k: 0.005, completionPer1k: 0.015 },
    'gpt-4o-mini': { promptPer1k: 0.00015, completionPer1k: 0.0006 },
  },
  anthropic: {
    // Sprint 12 pricing sanity check (2026-08-16) — claude-3-5-sonnet-20241022/claude-3-haiku-
    // 20240307 no longer appear anywhere on Anthropic's official pricing page (fetched live via
    // platform.claude.com/docs/en/about-claude/pricing), not even in its "retired" tier — replaced
    // with the current Claude 5 family. Sonnet 5: $2/$10 per MTok; Haiku 4.5: $1/$5 per MTok.
    'claude-sonnet-5': { promptPer1k: 0.002, completionPer1k: 0.01 },
    'claude-haiku-4-5-20251001': { promptPer1k: 0.001, completionPer1k: 0.005 },
  },
  gemini: {
    // gemini-1.5-pro/-flash were shut down 2025-09-29 — see gemini.provider.ts's DEFAULT_MODEL
    // comment. Pricing below is gemini-3.5-flash-lite (current default) — re-confirmed live via
    // web search 2026-08-16 (released 2026-07-21, $0.30/$2.50 per MTok, matches this entry exactly,
    // no change needed).
    'gemini-3.5-flash-lite': { promptPer1k: 0.0003, completionPer1k: 0.0025 },
  },
  mock: {
    'mock-model': { promptPer1k: 0, completionPer1k: 0 },
  },
};

/** Falls back to $0 for an unknown model (logged by the caller) rather than throwing — cost estimation must never break a real response. */
export function estimateCostUsd(
  provider: AIProviderName,
  model: string,
  promptTokens: number,
  completionTokens: number,
): number {
  const pricing = PRICING[provider]?.[model];
  if (!pricing) return 0;
  return (promptTokens / 1000) * pricing.promptPer1k + (completionTokens / 1000) * pricing.completionPer1k;
}
