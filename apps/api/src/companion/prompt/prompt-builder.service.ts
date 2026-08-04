import { Injectable } from '@nestjs/common';
import type { ChatMessage } from '../providers/provider.types';
import type { ConversationContext } from '../context/context.types';
import { buildSystemPrompt } from './system-prompt';

export interface HistoryTurn {
  role: 'user' | 'assistant';
  content: string;
}

const MAX_HISTORY_TURNS = 20;

/**
 * Pure, dependency-free assembly of the final message list sent to a
 * provider: system prompt (context.ts + system-prompt.ts) + retrieved-memory block (Sprint 3C,
 * optional) + conversation history + the new user message. No I/O, no provider calls — fully
 * unit testable in isolation (see prompt-builder.service.spec.ts).
 */
@Injectable()
export class PromptBuilderService {
  /**
   * `memoryBlock` comes from `MemoryContextAssembler` (Sprint 3C) — already budget-fitted and
   * count-capped there (see `MAX_MEMORIES_PER_TURN`); this method does not further filter it,
   * it only decides *where* it goes: appended to the one `system` message, never a separate
   * message role (providers only need `system`/`user`/`assistant`), and only when non-null —
   * a turn with nothing retrieved sends exactly the same prompt shape as before this sprint.
   */
  build(context: ConversationContext, history: HistoryTurn[], userMessage: string, memoryBlock: string | null = null): ChatMessage[] {
    const systemPrompt = memoryBlock ? `${buildSystemPrompt(context)}\n\n${memoryBlock}` : buildSystemPrompt(context);
    const trimmedHistory = history.slice(-MAX_HISTORY_TURNS);

    return [
      { role: 'system', content: systemPrompt },
      ...trimmedHistory.map((turn): ChatMessage => ({ role: turn.role, content: turn.content })),
      { role: 'user', content: userMessage },
    ];
  }
}
