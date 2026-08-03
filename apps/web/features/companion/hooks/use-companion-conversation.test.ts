import { act, renderHook, waitFor } from '@testing-library/react';
import { useCompanionConversation } from './use-companion-conversation';
import { conversationsApi } from '../api/conversations-api';
import { ApiError } from '@/lib/api-error';

jest.mock('../api/conversations-api', () => ({
  conversationsApi: {
    get: jest.fn(),
    sendMessage: jest.fn(),
    streamUrl: (id: string) => `http://api.test/companion/conversations/${id}/messages/stream`,
  },
}));

type Listener = (event: { data?: string }) => void;

class MockEventSource {
  static instances: MockEventSource[] = [];
  url: string;
  closed = false;
  onerror: ((event: unknown) => void) | null = null;
  private listeners: Record<string, Listener[]> = {};

  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);
  }

  addEventListener(type: string, listener: Listener) {
    this.listeners[type] = [...(this.listeners[type] ?? []), listener];
  }

  close() {
    this.closed = true;
  }

  emit(type: string, data?: unknown) {
    const event = data !== undefined ? { data: JSON.stringify(data) } : {};
    (this.listeners[type] ?? []).forEach((listener) => listener(event));
  }

  emitConnectionError() {
    this.onerror?.({});
  }

  static latest(): MockEventSource {
    return MockEventSource.instances[MockEventSource.instances.length - 1]!;
  }

  static reset() {
    MockEventSource.instances = [];
  }
}

describe('useCompanionConversation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    MockEventSource.reset();
    (global as unknown as { EventSource: unknown }).EventSource = MockEventSource;
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true, writable: true });
  });

  it('loads message history when a conversation id is set', async () => {
    (conversationsApi.get as jest.Mock).mockResolvedValue({
      conversation: { id: 'c1' },
      messages: [{ id: 'm1', role: 'user', content: 'Hi', createdAt: '2026-01-01T00:00:00.000Z' }],
    });

    const { result } = renderHook(() => useCompanionConversation('c1'));

    await waitFor(() => expect(result.current.messages).toHaveLength(1));
    expect(result.current.status).toBe('idle');
  });

  it('send() appends the user message and opens a stream when generation is required', async () => {
    (conversationsApi.get as jest.Mock).mockResolvedValue({ conversation: { id: 'c1' }, messages: [] });
    (conversationsApi.sendMessage as jest.Mock).mockResolvedValue({
      userMessage: { id: 'u1', role: 'user', content: 'Hello', createdAt: '2026-01-01T00:00:00.000Z' },
      assistantMessage: null,
      requiresGeneration: true,
    });

    const { result } = renderHook(() => useCompanionConversation('c1'));
    await waitFor(() => expect(result.current.status).toBe('idle'));

    await act(async () => {
      await result.current.send('Hello', 'c1');
    });

    expect(result.current.messages.some((m) => m.content === 'Hello')).toBe(true);
    expect(result.current.status).toBe('streaming');
    expect(MockEventSource.instances).toHaveLength(1);
    expect(MockEventSource.latest().url).toContain('c1');
  });

  it('accumulates token events into streamingText, then finalizes on done', async () => {
    (conversationsApi.get as jest.Mock).mockResolvedValue({ conversation: { id: 'c1' }, messages: [] });
    (conversationsApi.sendMessage as jest.Mock).mockResolvedValue({
      userMessage: { id: 'u1', role: 'user', content: 'Hi', createdAt: '2026-01-01T00:00:00.000Z' },
      assistantMessage: null,
      requiresGeneration: true,
    });

    const { result } = renderHook(() => useCompanionConversation('c1'));
    await waitFor(() => expect(result.current.status).toBe('idle'));
    await act(async () => {
      await result.current.send('Hi', 'c1');
    });

    act(() => MockEventSource.latest().emit('token', { content: 'Hello ' }));
    act(() => MockEventSource.latest().emit('token', { content: 'there' }));
    expect(result.current.streamingText).toBe('Hello there');

    act(() =>
      MockEventSource.latest().emit('done', {
        message: { id: 'a1', role: 'assistant', content: 'Hello there', createdAt: '2026-01-01T00:00:01.000Z' },
      }),
    );

    expect(result.current.status).toBe('idle');
    expect(result.current.streamingText).toBe('');
    expect(result.current.messages.some((m) => m.id === 'a1')).toBe(true);
    expect(MockEventSource.latest().closed).toBe(true);
  });

  it('cancel() closes the stream immediately and sets status "cancelled"', async () => {
    (conversationsApi.get as jest.Mock).mockResolvedValue({ conversation: { id: 'c1' }, messages: [] });
    (conversationsApi.sendMessage as jest.Mock).mockResolvedValue({
      userMessage: { id: 'u1', role: 'user', content: 'Hi', createdAt: '2026-01-01T00:00:00.000Z' },
      assistantMessage: null,
      requiresGeneration: true,
    });

    const { result } = renderHook(() => useCompanionConversation('c1'));
    await waitFor(() => expect(result.current.status).toBe('idle'));
    await act(async () => {
      await result.current.send('Hi', 'c1');
    });
    act(() => MockEventSource.latest().emit('token', { content: 'partial' }));

    act(() => result.current.cancel());

    expect(result.current.status).toBe('cancelled');
    expect(result.current.streamingText).toBe('');
    expect(MockEventSource.latest().closed).toBe(true);
  });

  it('a server-sent stream_error sets status "error" with the server message, distinct from a connection error', async () => {
    (conversationsApi.get as jest.Mock).mockResolvedValue({ conversation: { id: 'c1' }, messages: [] });
    (conversationsApi.sendMessage as jest.Mock).mockResolvedValue({
      userMessage: { id: 'u1', role: 'user', content: 'Hi', createdAt: '2026-01-01T00:00:00.000Z' },
      assistantMessage: null,
      requiresGeneration: true,
    });

    const { result } = renderHook(() => useCompanionConversation('c1'));
    await waitFor(() => expect(result.current.status).toBe('idle'));
    await act(async () => {
      await result.current.send('Hi', 'c1');
    });

    act(() => MockEventSource.latest().emit('stream_error', { message: 'All providers are unavailable.' }));

    expect(result.current.status).toBe('error');
    expect(result.current.errorMessage).toBe('All providers are unavailable.');
  });

  it('a native connection error while online sets status "error"; while offline sets status "offline"', async () => {
    (conversationsApi.get as jest.Mock).mockResolvedValue({ conversation: { id: 'c1' }, messages: [] });
    (conversationsApi.sendMessage as jest.Mock).mockResolvedValue({
      userMessage: { id: 'u1', role: 'user', content: 'Hi', createdAt: '2026-01-01T00:00:00.000Z' },
      assistantMessage: null,
      requiresGeneration: true,
    });
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });

    const { result } = renderHook(() => useCompanionConversation('c1'));
    await waitFor(() => expect(result.current.status).toBe('idle'));
    await act(async () => {
      await result.current.send('Hi', 'c1');
    });

    act(() => MockEventSource.latest().emitConnectionError());

    expect(result.current.status).toBe('offline');
  });

  it('a 429 from sendMessage sets status "rate_limited" without opening a stream', async () => {
    (conversationsApi.get as jest.Mock).mockResolvedValue({ conversation: { id: 'c1' }, messages: [] });
    (conversationsApi.sendMessage as jest.Mock).mockRejectedValue(new ApiError('Too many requests', 'RATE_LIMITED', 429));

    const { result } = renderHook(() => useCompanionConversation('c1'));
    await waitFor(() => expect(result.current.status).toBe('idle'));
    await act(async () => {
      await result.current.send('Hi', 'c1');
    });

    expect(result.current.status).toBe('rate_limited');
    expect(MockEventSource.instances).toHaveLength(0);
  });

  it('a safety-refused response appends both messages and never opens a stream', async () => {
    (conversationsApi.get as jest.Mock).mockResolvedValue({ conversation: { id: 'c1' }, messages: [] });
    (conversationsApi.sendMessage as jest.Mock).mockResolvedValue({
      userMessage: { id: 'u1', role: 'user', content: 'unsafe', createdAt: '2026-01-01T00:00:00.000Z' },
      assistantMessage: { id: 'a1', role: 'assistant', content: "I can't help with that.", createdAt: '2026-01-01T00:00:01.000Z' },
      requiresGeneration: false,
    });

    const { result } = renderHook(() => useCompanionConversation('c1'));
    await waitFor(() => expect(result.current.status).toBe('idle'));
    await act(async () => {
      await result.current.send('unsafe', 'c1');
    });

    expect(result.current.status).toBe('safety_refused');
    expect(result.current.messages).toHaveLength(2);
    expect(MockEventSource.instances).toHaveLength(0);
  });

  describe('draft preservation (Sprint 2B audit Finding 3)', () => {
    it('restores the draft when sendMessage fails outright (never persisted, nothing to retry against)', async () => {
      (conversationsApi.get as jest.Mock).mockResolvedValue({ conversation: { id: 'c1' }, messages: [] });
      (conversationsApi.sendMessage as jest.Mock).mockRejectedValue(new Error('network down'));

      const { result } = renderHook(() => useCompanionConversation('c1'));
      await waitFor(() => expect(result.current.status).toBe('idle'));
      act(() => result.current.setDraft('a message that never arrives'));

      await act(async () => {
        await result.current.send('a message that never arrives', 'c1');
      });

      expect(result.current.status).toBe('error');
      expect(result.current.draft).toBe('a message that never arrives');
    });

    it('restores the draft when the send is rate-limited (429)', async () => {
      (conversationsApi.get as jest.Mock).mockResolvedValue({ conversation: { id: 'c1' }, messages: [] });
      (conversationsApi.sendMessage as jest.Mock).mockRejectedValue(new ApiError('Too many requests', 'RATE_LIMITED', 429));

      const { result } = renderHook(() => useCompanionConversation('c1'));
      await waitFor(() => expect(result.current.status).toBe('idle'));
      act(() => result.current.setDraft('please send this'));

      await act(async () => {
        await result.current.send('please send this', 'c1');
      });

      expect(result.current.status).toBe('rate_limited');
      expect(result.current.draft).toBe('please send this');
    });

    it('restores the draft when the provider is unavailable (stream_error after a successful send)', async () => {
      (conversationsApi.get as jest.Mock).mockResolvedValue({ conversation: { id: 'c1' }, messages: [] });
      (conversationsApi.sendMessage as jest.Mock).mockResolvedValue({
        userMessage: { id: 'u1', role: 'user', content: 'Hi', createdAt: '2026-01-01T00:00:00.000Z' },
        assistantMessage: null,
        requiresGeneration: true,
      });

      const { result } = renderHook(() => useCompanionConversation('c1'));
      await waitFor(() => expect(result.current.status).toBe('idle'));
      act(() => result.current.setDraft('Hi'));

      await act(async () => {
        await result.current.send('Hi', 'c1');
      });
      // The message was safely persisted server-side (visible in `messages`)
      // by this point, but the draft is deliberately not cleared until the
      // stream genuinely completes — see the hook's `openStream` comment.
      expect(result.current.draft).toBe('Hi');

      act(() =>
        MockEventSource.latest().emit('stream_error', {
          message: 'All AI providers are currently unavailable.',
          code: 'PROVIDER_UNAVAILABLE',
        }),
      );

      expect(result.current.status).toBe('error');
      expect(result.current.draft).toBe('Hi');
    });

    it('clears the draft once the turn completes successfully', async () => {
      (conversationsApi.get as jest.Mock).mockResolvedValue({ conversation: { id: 'c1' }, messages: [] });
      (conversationsApi.sendMessage as jest.Mock).mockResolvedValue({
        userMessage: { id: 'u1', role: 'user', content: 'Hi', createdAt: '2026-01-01T00:00:00.000Z' },
        assistantMessage: null,
        requiresGeneration: true,
      });

      const { result } = renderHook(() => useCompanionConversation('c1'));
      await waitFor(() => expect(result.current.status).toBe('idle'));
      act(() => result.current.setDraft('Hi'));
      await act(async () => {
        await result.current.send('Hi', 'c1');
      });

      act(() =>
        MockEventSource.latest().emit('done', {
          message: { id: 'a1', role: 'assistant', content: 'Hi there', createdAt: '2026-01-01T00:00:01.000Z' },
        }),
      );

      expect(result.current.status).toBe('idle');
      expect(result.current.draft).toBe('');
    });

    it('clears the draft on a safety refusal — nothing left to resend', async () => {
      (conversationsApi.get as jest.Mock).mockResolvedValue({ conversation: { id: 'c1' }, messages: [] });
      (conversationsApi.sendMessage as jest.Mock).mockResolvedValue({
        userMessage: { id: 'u1', role: 'user', content: 'unsafe', createdAt: '2026-01-01T00:00:00.000Z' },
        assistantMessage: { id: 'a1', role: 'assistant', content: "I can't help with that.", createdAt: '2026-01-01T00:00:01.000Z' },
        requiresGeneration: false,
      });

      const { result } = renderHook(() => useCompanionConversation('c1'));
      await waitFor(() => expect(result.current.status).toBe('idle'));
      act(() => result.current.setDraft('unsafe'));
      await act(async () => {
        await result.current.send('unsafe', 'c1');
      });

      expect(result.current.status).toBe('safety_refused');
      expect(result.current.draft).toBe('');
    });

    it('clears the draft on cancel — the turn is already persisted, nothing to resend', async () => {
      (conversationsApi.get as jest.Mock).mockResolvedValue({ conversation: { id: 'c1' }, messages: [] });
      (conversationsApi.sendMessage as jest.Mock).mockResolvedValue({
        userMessage: { id: 'u1', role: 'user', content: 'Hi', createdAt: '2026-01-01T00:00:00.000Z' },
        assistantMessage: null,
        requiresGeneration: true,
      });

      const { result } = renderHook(() => useCompanionConversation('c1'));
      await waitFor(() => expect(result.current.status).toBe('idle'));
      act(() => result.current.setDraft('Hi'));
      await act(async () => {
        await result.current.send('Hi', 'c1');
      });

      act(() => result.current.cancel());

      expect(result.current.status).toBe('cancelled');
      expect(result.current.draft).toBe('');
    });

    it('retry() sends exactly one new request (re-opens the stream) without touching sendMessage again', async () => {
      (conversationsApi.get as jest.Mock).mockResolvedValue({ conversation: { id: 'c1' }, messages: [] });
      (conversationsApi.sendMessage as jest.Mock).mockResolvedValue({
        userMessage: { id: 'u1', role: 'user', content: 'Hi', createdAt: '2026-01-01T00:00:00.000Z' },
        assistantMessage: null,
        requiresGeneration: true,
      });

      const { result } = renderHook(() => useCompanionConversation('c1'));
      await waitFor(() => expect(result.current.status).toBe('idle'));
      await act(async () => {
        await result.current.send('Hi', 'c1');
      });
      act(() => MockEventSource.latest().emit('stream_error', { message: 'down' }));
      expect(conversationsApi.sendMessage).toHaveBeenCalledTimes(1);

      act(() => result.current.retry());

      expect(conversationsApi.sendMessage).toHaveBeenCalledTimes(1);
      expect(MockEventSource.instances).toHaveLength(2);
    });
  });

  it('retry() re-opens a fresh stream to the same conversation', async () => {
    (conversationsApi.get as jest.Mock).mockResolvedValue({ conversation: { id: 'c1' }, messages: [] });
    (conversationsApi.sendMessage as jest.Mock).mockResolvedValue({
      userMessage: { id: 'u1', role: 'user', content: 'Hi', createdAt: '2026-01-01T00:00:00.000Z' },
      assistantMessage: null,
      requiresGeneration: true,
    });

    const { result } = renderHook(() => useCompanionConversation('c1'));
    await waitFor(() => expect(result.current.status).toBe('idle'));
    await act(async () => {
      await result.current.send('Hi', 'c1');
    });
    act(() => MockEventSource.latest().emit('stream_error', { message: 'down' }));
    expect(result.current.status).toBe('error');

    act(() => result.current.retry());

    expect(result.current.status).toBe('streaming');
    expect(MockEventSource.instances).toHaveLength(2);
  });
});
