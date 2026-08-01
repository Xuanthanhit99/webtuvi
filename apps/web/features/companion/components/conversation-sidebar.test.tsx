import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConversationSidebar } from './conversation-sidebar';

const conversations = [
  { id: 'c1', title: 'New job', status: 'active' as const, messageCount: 4, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'c2', title: null, status: 'active' as const, messageCount: 1, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
];

describe('ConversationSidebar', () => {
  it('shows an empty state when there are no conversations', () => {
    render(
      <ConversationSidebar conversations={[]} isLoading={false} activeId={null} onSelect={jest.fn()} onCreate={jest.fn()} creating={false} />,
    );
    expect(screen.getByText(/no conversations yet/i)).toBeInTheDocument();
  });

  it('lists conversations, falling back to a placeholder title when untitled', () => {
    render(
      <ConversationSidebar conversations={conversations} isLoading={false} activeId="c1" onSelect={jest.fn()} onCreate={jest.fn()} creating={false} />,
    );
    expect(screen.getByText('New job')).toBeInTheDocument();
    expect(screen.getByText('Untitled conversation')).toBeInTheDocument();
  });

  it('marks the active conversation with aria-current', () => {
    render(
      <ConversationSidebar conversations={conversations} isLoading={false} activeId="c1" onSelect={jest.fn()} onCreate={jest.fn()} creating={false} />,
    );
    expect(screen.getByText('New job').closest('button')).toHaveAttribute('aria-current', 'true');
    expect(screen.getByText('Untitled conversation').closest('button')).not.toHaveAttribute('aria-current');
  });

  it('calls onSelect when a conversation is clicked, and onCreate for the new-conversation button', async () => {
    const onSelect = jest.fn();
    const onCreate = jest.fn();
    const user = userEvent.setup();
    render(
      <ConversationSidebar conversations={conversations} isLoading={false} activeId={null} onSelect={onSelect} onCreate={onCreate} creating={false} />,
    );

    await user.click(screen.getByText('New job'));
    expect(onSelect).toHaveBeenCalledWith('c1');

    await user.click(screen.getByRole('button', { name: /new conversation/i }));
    expect(onCreate).toHaveBeenCalled();
  });
});
