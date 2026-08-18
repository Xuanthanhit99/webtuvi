import type { AIFeature as PrismaAIFeature } from '@prisma/client';

/**
 * Sprint 12 — which product surface an AI generation belongs to. Lowercase TS-side union,
 * mirroring `AIProviderName`'s own shape/convention (`provider.types.ts`), mapped to the
 * uppercase Prisma `AIFeature` enum via `toPrismaAIFeature()` exactly like `toPrismaProviderName()`
 * already does for providers. See docs/architecture/discovery-ai-cost-control.md.
 */
export type AIFeature = 'companion' | 'tarot' | 'numerology' | 'natal_chart' | 'reports' | 'eastern_horoscope';

/** The three Discovery surfaces — everything except Companion. */
export type DiscoveryAIFeature = Exclude<AIFeature, 'companion'>;

export function toPrismaAIFeature(feature: AIFeature): PrismaAIFeature {
  return feature.toUpperCase() as PrismaAIFeature;
}
