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
    'claude-3-5-sonnet-20241022': { promptPer1k: 0.003, completionPer1k: 0.015 },
    'claude-3-haiku-20240307': { promptPer1k: 0.00025, completionPer1k: 0.00125 },
  },
  gemini: {
    'gemini-1.5-pro': { promptPer1k: 0.00125, completionPer1k: 0.005 },
    'gemini-1.5-flash': { promptPer1k: 0.000075, completionPer1k: 0.0003 },
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
