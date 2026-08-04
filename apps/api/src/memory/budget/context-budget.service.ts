import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppConfiguration } from '../../config/configuration';

export interface ContextBudgetInput {
  systemPromptText?: string;
  conversationText?: string;
  userInputText?: string;
}

export interface ContextBudgetDto {
  totalWindowTokens: number;
  reservedOutputTokens: number;
  systemPromptTokens: number;
  conversationTokens: number;
  userInputTokens: number;
  memoryTokens: number;
}

export interface BudgetFitResult<T extends { id: string }> {
  included: T[];
  excluded: T[];
  tokenUsed: number;
}

/**
 * Deterministic context token budgeting (Phase 6). Token counts are an estimate — a fixed
 * `Math.ceil(text.length / 4)` heuristic, the same rough approximation commonly used for
 * English text without invoking a real tokenizer/model. This is intentionally simple
 * arithmetic, not AI, and is disclosed as an approximation (not exact token counts) in
 * docs/architecture/memory-intelligence.md "Context budget algorithm" and "Known limitations".
 *
 * The budget always reserves output tokens first (a generation that can't finish because its
 * own reply had no room left is a worse failure than a shorter prompt), then hands the system
 * prompt and actual conversation/user-input text their real (estimated) cost, and gives memory
 * whatever is left over, capped by `memoryMaxTokens` so memory can never crowd out everything
 * else even in a very small context window.
 */
@Injectable()
export class ContextBudgetService {
  constructor(private readonly configService: ConfigService) {}

  /** `Math.ceil` is deliberate — under-counting a budget risks silently exceeding it. */
  estimateTokens(text: string): number {
    if (!text) return 0;
    return Math.ceil(text.length / 4);
  }

  computeBudget(input: ContextBudgetInput = {}): ContextBudgetDto {
    const config = this.configService.get<AppConfiguration>('app')!.memory.contextBudget;

    const systemPromptTokens = this.estimateTokens(input.systemPromptText ?? '');
    const userInputTokens = this.estimateTokens(input.userInputText ?? '');
    const conversationTokens = Math.min(
      this.estimateTokens(input.conversationText ?? ''),
      config.conversationMaxTokens,
    );

    const reservedOutputTokens = config.reservedOutputTokens;
    const usedBeforeMemory = reservedOutputTokens + systemPromptTokens + userInputTokens + conversationTokens;
    const remaining = Math.max(0, config.totalWindowTokens - usedBeforeMemory);
    const memoryTokens = Math.min(remaining, config.memoryMaxTokens);

    return {
      totalWindowTokens: config.totalWindowTokens,
      reservedOutputTokens,
      systemPromptTokens,
      conversationTokens,
      userInputTokens,
      memoryTokens,
    };
  }

  /** Greedily includes items in the order given (callers pass already-ranked items): each item
   * is included if it still fits in the remaining budget, otherwise it's skipped and the next
   * (lower-ranked) item is still tried — so a later, smaller item can fill a gap left by an
   * earlier one that didn't fit, maximizing how much of the budget is actually used rather than
   * stopping at the first miss. `excluded` preserves input order for callers that want to know
   * what was left out. */
  fitToBudget<T extends { id: string; text: string }>(items: T[], budgetTokens: number): BudgetFitResult<T> {
    const included: T[] = [];
    const excluded: T[] = [];
    let tokenUsed = 0;

    for (const item of items) {
      const cost = this.estimateTokens(item.text);
      if (tokenUsed + cost <= budgetTokens) {
        included.push(item);
        tokenUsed += cost;
      } else {
        excluded.push(item);
      }
    }

    return { included, excluded, tokenUsed };
  }
}
