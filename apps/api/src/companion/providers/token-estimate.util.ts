/**
 * Approximate token count: ~4 characters per token, the commonly-cited
 * average for English text across GPT/Claude/Gemini tokenizers. This is a
 * heuristic, not real tokenization (no tiktoken/WASM dependency — see
 * docs/architecture/companion-core.md "Token counting" for why that trade-off
 * was made). Real usage numbers always come from the provider's own API
 * response when available; this estimate is only used for pre-flight
 * cost/limit checks before a request is sent.
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}
