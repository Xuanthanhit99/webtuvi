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
 * provider: system prompt (context.ts + system-prompt.ts) + conversation
 * history + the new user message. No I/O, no provider calls — fully unit
 * testable in isolation (see prompt-builder.service.spec.ts).
 */
@Injectable()
export class PromptBuilderService {
  build(context: ConversationContext, history: HistoryTurn[], userMessage: string): ChatMessage[] {
    const systemPrompt = buildSystemPrompt(context);
    const trimmedHistory = history.slice(-MAX_HISTORY_TURNS);

    return [
      { role: 'system', content: systemPrompt },
      ...trimmedHistory.map((turn): ChatMessage => ({ role: turn.role, content: turn.content })),
      { role: 'user', content: userMessage },
    ];
  }
}
