import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Composer } from './composer';

const noop = () => {};

describe('Composer', () => {
  it('disables Send until there is text, and sends the trimmed content on submit', async () => {
    const onSend = jest.fn();
    const user = userEvent.setup();
    render(<Composer status="idle" errorMessage={null} onSend={onSend} onCancel={noop} onRetry={noop} onDismiss={noop} />);

    const sendButton = screen.getByRole('button', { name: /send message/i });
    expect(sendButton).toBeDisabled();

    await user.type(screen.getByLabelText(/message your companion/i), '  Hello there  ');
    expect(sendButton).toBeEnabled();

    await user.click(sendButton);
    expect(onSend).toHaveBeenCalledWith('Hello there');
  });

  it('sends on Enter and inserts a newline on Shift+Enter', async () => {
    const onSend = jest.fn();
    const user = userEvent.setup();
    render(<Composer status="idle" errorMessage={null} onSend={onSend} onCancel={noop} onRetry={noop} onDismiss={noop} />);

    const textarea = screen.getByLabelText(/message your companion/i);
    await user.type(textarea, 'Line one{Shift>}{Enter}{/Shift}Line two');
    expect(onSend).not.toHaveBeenCalled();
    expect(textarea).toHaveValue('Line one\nLine two');

    await user.type(textarea, '{Enter}');
    expect(onSend).toHaveBeenCalledWith('Line one\nLine two');
  });

  it('shows a streaming indicator with a Cancel action while streaming', async () => {
    const onCancel = jest.fn();
    const user = userEvent.setup();
    render(<Composer status="streaming" errorMessage={null} onSend={noop} onCancel={onCancel} onRetry={noop} onDismiss={noop} />);

    expect(screen.getByText(/responding/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalled();
  });

  it('shows a Retry action on error, offline, and rate-limited states', async () => {
    const onRetry = jest.fn();
    const user = userEvent.setup();
    const { rerender } = render(
      <Composer status="error" errorMessage="boom" onSend={noop} onCancel={noop} onRetry={onRetry} onDismiss={noop} />,
    );
    expect(screen.getByText('boom')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /retry/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);

    rerender(<Composer status="offline" errorMessage={null} onSend={noop} onCancel={noop} onRetry={onRetry} onDismiss={noop} />);
    expect(screen.getByText(/you're offline/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('does not offer Retry after a cancelled turn — only a Dismiss action', () => {
    render(<Composer status="cancelled" errorMessage={null} onSend={noop} onCancel={noop} onRetry={noop} onDismiss={noop} />);
    expect(screen.getByText(/you cancelled/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
  });

  it('shows a safety-refusal message distinct from a generic error', () => {
    render(
      <Composer
        status="safety_refused"
        errorMessage="I can't help with that."
        onSend={noop}
        onCancel={noop}
        onRetry={noop}
        onDismiss={noop}
      />,
    );
    expect(screen.getByText("I can't help with that.")).toBeInTheDocument();
  });

  it('disables the textarea while sending or streaming', () => {
    const { rerender } = render(
      <Composer status="sending" errorMessage={null} onSend={noop} onCancel={noop} onRetry={noop} onDismiss={noop} />,
    );
    expect(screen.getByLabelText(/message your companion/i)).toBeDisabled();

    rerender(<Composer status="streaming" errorMessage={null} onSend={noop} onCancel={noop} onRetry={noop} onDismiss={noop} />);
    expect(screen.getByLabelText(/message your companion/i)).toBeDisabled();
  });
});
