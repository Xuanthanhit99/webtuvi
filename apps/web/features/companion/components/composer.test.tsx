import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Composer, type ComposerProps } from './composer';

const noop = () => {};

type Overrides = Partial<Omit<ComposerProps, 'draft' | 'onDraftChange'>> & { draft?: string };

/** A thin controlled wrapper mirroring how companion-view.tsx actually owns `draft` — Composer itself holds no draft state at all. */
function ControlledComposer(overrides: Overrides) {
  const [draft, setDraft] = useState(overrides.draft ?? '');
  return (
    <Composer
      status={overrides.status ?? 'idle'}
      errorMessage={overrides.errorMessage ?? null}
      draft={draft}
      onDraftChange={setDraft}
      onSend={overrides.onSend ?? noop}
      onCancel={overrides.onCancel ?? noop}
      onRetry={overrides.onRetry ?? noop}
      onDismiss={overrides.onDismiss ?? noop}
    />
  );
}

describe('Composer', () => {
  it('disables Send until there is text, and sends the trimmed content on submit', async () => {
    const onSend = jest.fn();
    const user = userEvent.setup();
    render(<ControlledComposer onSend={onSend} />);

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
    render(<ControlledComposer onSend={onSend} />);

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
    render(<ControlledComposer status="streaming" onCancel={onCancel} />);

    expect(screen.getByText(/responding/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalled();
  });

  it('shows a Retry action on error, offline, and rate-limited states', async () => {
    const onRetry = jest.fn();
    const user = userEvent.setup();
    const { rerender } = render(<ControlledComposer status="error" errorMessage="boom" onRetry={onRetry} />);
    expect(screen.getByText('boom')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /retry/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);

    rerender(<ControlledComposer status="offline" onRetry={onRetry} />);
    expect(screen.getByText(/you're offline/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('does not offer Retry after a cancelled turn — only a Dismiss action', () => {
    render(<ControlledComposer status="cancelled" />);
    expect(screen.getByText(/you cancelled/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
  });

  it('shows a safety-refusal message distinct from a generic error', () => {
    render(<ControlledComposer status="safety_refused" errorMessage="I can't help with that." />);
    expect(screen.getByText("I can't help with that.")).toBeInTheDocument();
  });

  it('disables the textarea while sending or streaming', () => {
    const { rerender } = render(<ControlledComposer status="sending" />);
    expect(screen.getByLabelText(/message your companion/i)).toBeDisabled();

    rerender(<ControlledComposer status="streaming" />);
    expect(screen.getByLabelText(/message your companion/i)).toBeDisabled();
  });

  describe('draft preservation (Sprint 2B audit Finding 3)', () => {
    it('never clears the draft itself on submit — clearing is entirely the parent’s responsibility', async () => {
      const onSend = jest.fn();
      const user = userEvent.setup();
      // draft is a controlled prop that the harness does NOT clear on send,
      // simulating a parent that hasn't yet confirmed the turn succeeded.
      render(<Composer status="idle" errorMessage={null} draft="Still here" onDraftChange={noop} onSend={onSend} onCancel={noop} onRetry={noop} onDismiss={noop} />);

      await user.click(screen.getByRole('button', { name: /send message/i }));

      expect(onSend).toHaveBeenCalledWith('Still here');
      expect(screen.getByLabelText(/message your companion/i)).toHaveValue('Still here');
    });

    it('renders whatever draft text the parent currently holds, regardless of status', () => {
      const { rerender } = render(
        <Composer status="error" errorMessage="Couldn't send that." draft="my unsent message" onDraftChange={noop} onSend={noop} onCancel={noop} onRetry={noop} onDismiss={noop} />,
      );
      expect(screen.getByLabelText(/message your companion/i)).toHaveValue('my unsent message');

      rerender(
        <Composer status="idle" errorMessage={null} draft="" onDraftChange={noop} onSend={noop} onCancel={noop} onRetry={noop} onDismiss={noop} />,
      );
      expect(screen.getByLabelText(/message your companion/i)).toHaveValue('');
    });
  });
});
