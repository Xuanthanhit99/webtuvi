import { render, screen } from '@testing-library/react';
import { MessageItem, StreamingMessageItem } from './message-item';

describe('MessageItem', () => {
  it('labels a user message "You"', () => {
    render(<MessageItem message={{ id: '1', role: 'user', content: 'Hello', createdAt: '2026-01-01T00:00:00.000Z' }} />);
    expect(screen.getByText('You')).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('labels an assistant message "Companion"', () => {
    render(<MessageItem message={{ id: '2', role: 'assistant', content: 'Hi there', createdAt: '2026-01-01T00:00:00.000Z' }} />);
    expect(screen.getByText('Companion')).toBeInTheDocument();
    expect(screen.getByText('Hi there')).toBeInTheDocument();
  });

  it('preserves newlines in message content', () => {
    render(<MessageItem message={{ id: '3', role: 'assistant', content: 'Line one\nLine two', createdAt: '2026-01-01T00:00:00.000Z' }} />);
    expect(screen.getByText((_, el) => el?.textContent === 'Line one\nLine two')).toBeInTheDocument();
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
