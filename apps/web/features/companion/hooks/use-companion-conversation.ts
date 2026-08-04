'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { CompanionMemoryUsageDto, ConversationMessageDto, ForgetSuggestionDto, JournalSuggestionDto, MemorySuggestionDto } from '@beaconvie/types';
import { conversationsApi } from '../api/conversations-api';
import { ApiError } from '@/lib/api-error';

export type ComposerStatus =
  | 'idle'
  | 'sending'
  | 'streaming'
  | 'error'
  | 'rate_limited'
  | 'safety_refused'
  | 'offline'
  | 'cancelled';

interface DoneEventData {
  message: ConversationMessageDto;
  /** Sprint 3C — ephemeral, this-turn-only (see StreamService); `used` here duplicates what's
   * now persisted on `message.memoryUsed` but already carries full explanations, so the UI can
   * show "why" immediately without a second fetch right after generation. */
  memoryUsage?: CompanionMemoryUsageDto;
}

export interface PendingMemorySuggestion {
  suggestion: MemorySuggestionDto;
  sourceConversationId: string;
  sourceMessageId: string;
}

export interface PendingForgetSuggestion {
  suggestion: ForgetSuggestionDto;
}

export interface PendingJournalSuggestion {
  suggestion: JournalSuggestionDto;
  sourceConversationId: string;
  sourceMessageId: string;
}

/** Ephemeral "why I ignored" data for the message that was *just* generated — never available
 * again after this, including on reload (see StreamService's "never persisted" decision). */
export interface LastTurnMemoryUsage {
  messageId: string;
  memoryUsage: CompanionMemoryUsageDto;
}

/**
 * Owns one conversation's messages + the SSE lifecycle for the in-flight
 * assistant reply. `EventSource`, not WebSocket, per the architecture — see
 * docs/architecture/companion-core.md "Streaming".
 */
export function useCompanionConversation(conversationId: string | null) {
  const [messages, setMessages] = useState<ConversationMessageDto[]>([]);
  const [status, setStatus] = useState<ComposerStatus>('idle');
  const [streamingText, setStreamingText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  // Owned here, not in the Composer, so it survives a failed send/stream and
  // is only cleared on a genuine, definitive outcome for that specific turn
  // (a completed reply, a safety refusal, or a deliberate cancel) — never
  // synchronously on submit. See Sprint 2B audit Finding 3.
  const [draft, setDraft] = useState('');
  const [pendingMemorySuggestion, setPendingMemorySuggestion] = useState<PendingMemorySuggestion | null>(null);
  const [pendingForgetSuggestion, setPendingForgetSuggestion] = useState<PendingForgetSuggestion | null>(null);
  const [pendingJournalSuggestion, setPendingJournalSuggestion] = useState<PendingJournalSuggestion | null>(null);
  const [lastTurnMemoryUsage, setLastTurnMemoryUsage] = useState<LastTurnMemoryUsage | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const closeStream = useCallback(() => {
    eventSourceRef.current?.close();
    eventSourceRef.current = null;
  }, []);

  useEffect(() => closeStream, [closeStream]);

  const loadHistory = useCallback(async (id: string) => {
    setIsLoadingHistory(true);
    try {
      const detail = await conversationsApi.get(id);
      setMessages(detail.messages);
      setStatus('idle');
    } catch {
      setStatus('error');
      setErrorMessage("Couldn't load this conversation.");
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    closeStream();
    setStreamingText('');
    if (conversationId) {
      void loadHistory(conversationId);
    } else {
      setMessages([]);
      setStatus('idle');
    }
  }, [conversationId, loadHistory, closeStream]);

  const openStream = useCallback(
    (id: string) => {
      closeStream();
      setStreamingText('');
      setStatus('streaming');

      const source = new EventSource(conversationsApi.streamUrl(id), { withCredentials: true });
      eventSourceRef.current = source;

      source.addEventListener('token', (event) => {
        const data = JSON.parse((event as MessageEvent).data) as { content: string };
        setStreamingText((prev) => prev + data.content);
      });

      source.addEventListener('done', (event) => {
        const data = JSON.parse((event as MessageEvent).data) as DoneEventData;
        setMessages((prev) => [...prev, data.message]);
        if (data.memoryUsage) {
          setLastTurnMemoryUsage({ messageId: data.message.id, memoryUsage: data.memoryUsage });
        }
        setStreamingText('');
        closeStream();
        setStatus('idle');
        setDraft('');
      });

      source.addEventListener('stream_error', (event) => {
        const data = JSON.parse((event as MessageEvent).data) as { message: string };
        setErrorMessage(data.message);
        setStreamingText('');
        closeStream();
        setStatus('error');
      });

      // Native connection-level failure (not a server-sent stream_error) — see
      // stream.controller.ts for why these are deliberately different SSE event names.
      source.onerror = () => {
        closeStream();
        setStreamingText('');
        setStatus(typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'error');
        setErrorMessage((current) => current ?? "Lost connection to your Companion.");
      };
    },
    [closeStream],
  );

  const send = useCallback(
    async (content: string, id: string) => {
      setStatus('sending');
      setErrorMessage(null);
      try {
        const result = await conversationsApi.sendMessage(id, content);
        setMessages((prev) => [...prev, result.userMessage]);

        // Sprint 3C, Phases 4/5 — surfaced as a distinct, dismissible card (see
        // MemorySuggestionCard/ForgetSuggestionCard), never acted on automatically.
        setPendingMemorySuggestion(
          result.memorySuggestion
            ? { suggestion: result.memorySuggestion, sourceConversationId: id, sourceMessageId: result.userMessage.id }
            : null,
        );
        setPendingForgetSuggestion(result.forgetSuggestion ? { suggestion: result.forgetSuggestion } : null);
        setPendingJournalSuggestion(
          result.journalSuggestion
            ? { suggestion: result.journalSuggestion, sourceConversationId: id, sourceMessageId: result.userMessage.id }
            : null,
        );

        if (!result.requiresGeneration) {
          if (result.assistantMessage) setMessages((prev) => [...prev, result.assistantMessage!]);
          setStatus('safety_refused');
          setDraft('');
          return;
        }

        // Do NOT clear the draft here — the message is safely persisted
        // server-side (visible in `messages`), but the turn isn't genuinely
        // "done" until the stream completes; keeping the submitted text
        // visible (disabled) through `openStream` doubles as "a recoverable
        // copy of the submitted text during streaming" per the audit fix.
        openStream(id);
      } catch (error) {
        // Never clear the draft on a failed send — nothing was persisted,
        // so the user's typed text would otherwise be lost outright.
        if (error instanceof ApiError && error.status === 429) {
          setStatus('rate_limited');
          setErrorMessage(error.message);
          return;
        }
        setStatus('error');
        setErrorMessage(error instanceof ApiError ? error.message : "Couldn't send that. Please try again.");
      }
    },
    [openStream],
  );

  const cancel = useCallback(() => {
    closeStream();
    setStreamingText('');
    setStatus('cancelled');
    // The cancelled turn is already persisted (StreamService writes a
    // "(cancelled)"/partial placeholder) — nothing left to resend, so the
    // draft is cleared the same as any other definitive turn outcome.
    setDraft('');
  }, [closeStream]);

  const retry = useCallback(() => {
    if (conversationId) openStream(conversationId);
  }, [conversationId, openStream]);

  const reset = useCallback(() => {
    setStatus('idle');
    setErrorMessage(null);
  }, []);

  return {
    messages,
    status,
    streamingText,
    errorMessage,
    isLoadingHistory,
    draft,
    setDraft,
    send,
    cancel,
    retry,
    reset,
    pendingMemorySuggestion,
    clearMemorySuggestion: useCallback(() => setPendingMemorySuggestion(null), []),
    pendingForgetSuggestion,
    clearForgetSuggestion: useCallback(() => setPendingForgetSuggestion(null), []),
    pendingJournalSuggestion,
    clearJournalSuggestion: useCallback(() => setPendingJournalSuggestion(null), []),
    lastTurnMemoryUsage,
  };
}
