'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ConversationMessageDto } from '@beaconvie/types';
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
        setStreamingText('');
        closeStream();
        setStatus('idle');
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

        if (!result.requiresGeneration) {
          if (result.assistantMessage) setMessages((prev) => [...prev, result.assistantMessage!]);
          setStatus('safety_refused');
          return;
        }

        openStream(id);
      } catch (error) {
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
  }, [closeStream]);

  const retry = useCallback(() => {
    if (conversationId) openStream(conversationId);
  }, [conversationId, openStream]);

  const reset = useCallback(() => {
    setStatus('idle');
    setErrorMessage(null);
  }, []);

  return { messages, status, streamingText, errorMessage, isLoadingHistory, send, cancel, retry, reset };
}
