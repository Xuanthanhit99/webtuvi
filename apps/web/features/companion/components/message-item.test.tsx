import { fireEvent, render, screen } from '@testing-library/react';
import { renderWithQuery } from '@/test/render-with-query';
import { MessageItem, StreamingMessageItem } from './message-item';
import { memoryApi } from '@/features/memory/api/memory-api';

jest.mock('@/features/memory/api/memory-api', () => ({
  memoryApi: {
    get: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  },
}));

describe('MessageItem', () => {
  it('labels a user message "You"', () => {
    render(<MessageItem message={{ id: '1', role: 'user', content: 'Hello', createdAt: '2026-01-01T00:00:00.000Z', memoryUsed: null }} />);
    expect(screen.getByText('You')).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('labels an assistant message "Companion"', () => {
    render(
      <MessageItem message={{ id: '2', role: 'assistant', content: 'Hi there', createdAt: '2026-01-01T00:00:00.000Z', memoryUsed: null }} />,
    );
    expect(screen.getByText('Companion')).toBeInTheDocument();
    expect(screen.getByText('Hi there')).toBeInTheDocument();
  });

  it('preserves newlines in message content', () => {
    render(
      <MessageItem
        message={{ id: '3', role: 'assistant', content: 'Line one\nLine two', createdAt: '2026-01-01T00:00:00.000Z', memoryUsed: null }}
      />,
    );
    expect(screen.getByText((_, el) => el?.textContent === 'Line one\nLine two')).toBeInTheDocument();
  });

  it('shows no "Memory used" control when the assistant message used no memory', () => {
    render(
      <MessageItem
        message={{ id: '4', role: 'assistant', content: 'No memory here', createdAt: '2026-01-01T00:00:00.000Z', memoryUsed: [] }}
        conversationId="conv-1"
      />,
    );
    expect(screen.queryByText(/Show memory used/i)).not.toBeInTheDocument();
  });

  it('shows a "Memory used" control for a persisted memory reference and expands it into a real Memory Card', async () => {
    (memoryApi.get as jest.Mock).mockResolvedValue({
      id: 'mem-1',
      type: 'GOAL',
      title: 'Learn Japanese',
      summary: 'Working toward JLPT N3',
      createdAt: '2026-01-01T00:00:00.000Z',
    });

    renderWithQuery(
      <MessageItem
        message={{
          id: '5',
          role: 'assistant',
          content: 'About your Japanese goal...',
          createdAt: '2026-01-02T00:00:00.000Z',
          memoryUsed: [
            {
              memoryId: 'mem-1',
              title: 'Learn Japanese',
              type: 'GOAL',
              reason: 'This relates to a goal you mentioned.',
              retrievalType: 'CONTEXT_MATCH',
              importance: { score: 62, explanations: ['This relates to a goal or a decision you made.'] },
              retrievalTimestamp: '2026-01-02T00:00:00.000Z',
              sourceConversationId: 'conv-0',
              createdAt: '2026-01-01T00:00:00.000Z',
            },
          ],
        }}
        conversationId="conv-1"
      />,
    );

    const toggle = await screen.findByText('Show memory used (1)');
    fireEvent.click(toggle);
    expect(await screen.findByText('Learn Japanese')).toBeInTheDocument();
    expect(screen.getByText('Working toward JLPT N3')).toBeInTheDocument();
  });

  it('never renders a Memory Used control without conversationId, even when memoryUsed is populated', () => {
    render(
      <MessageItem
        message={{
          id: '6',
          role: 'assistant',
          content: 'Reply',
          createdAt: '2026-01-01T00:00:00.000Z',
          memoryUsed: [
            {
              memoryId: 'mem-1',
              title: 'Learn Japanese',
              type: 'GOAL',
              reason: 'x',
              retrievalType: 'CONTEXT_MATCH',
              importance: { score: 1, explanations: [] },
              retrievalTimestamp: '2026-01-01T00:00:00.000Z',
              sourceConversationId: null,
              createdAt: '2026-01-01T00:00:00.000Z',
            },
          ],
        }}
      />,
    );
    expect(screen.queryByText(/Show memory used/i)).not.toBeInTheDocument();
  });
});

describe('StreamingMessageItem', () => {
  it('shows the partial text under the Companion label', () => {
    render(<StreamingMessageItem text="Thinking about that" />);
    expect(screen.getByText('Companion')).toBeInTheDocument();
    expect(screen.getByText(/Thinking about that/)).toBeInTheDocument();
  });

  it('is aria-hidden so a growing token stream is never individually announced to a screen reader (Sprint 2B audit Finding 5)', () => {
    const { container, rerender } = render(<StreamingMessageItem text="One" />);
    const node = container.firstElementChild as HTMLElement;
    expect(node).toHaveAttribute('aria-hidden', 'true');

    rerender(<StreamingMessageItem text="One two three" />);
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
  });
});
