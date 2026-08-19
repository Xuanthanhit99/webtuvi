import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ShareButton } from './share-button';
import { toast } from '@/components/ui/toast';
import { SITE_NAME, SITE_URL, DEFAULT_DESCRIPTION } from '@/lib/seo';

jest.mock('@/components/ui/toast', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

describe('ShareButton', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    // @ts-expect-error -- test-only cleanup of a property we define per-test below.
    delete navigator.share;
  });

  it('is a real, keyboard-accessible button with a visible name (not icon-only)', () => {
    render(<ShareButton />);
    const button = screen.getByRole('button', { name: `Share ${SITE_NAME}` });
    expect(button).toBeInTheDocument();
    expect(button.tagName).toBe('BUTTON');
    // Visible text label, not just an aria-label on an icon — the h2 rule against icon-only
    // unlabeled controls (final report §14).
    expect(button).toHaveTextContent('Share');
  });

  it('calls the Web Share API with only public, non-sensitive product data when available', async () => {
    const share = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { value: share, configurable: true });
    const user = userEvent.setup();

    render(<ShareButton />);
    await user.click(screen.getByRole('button', { name: `Share ${SITE_NAME}` }));

    expect(share).toHaveBeenCalledWith({
      title: SITE_NAME,
      text: DEFAULT_DESCRIPTION,
      url: SITE_URL,
    });

    // Adversarial: the payload must never contain sensitive sentinel-shaped values.
    const payload = JSON.stringify(share.mock.calls[0][0]);
    for (const sentinel of ['SENTINEL_EMAIL', 'SENTINEL_BIRTHDATE', 'SENTINEL_TAROT_QUESTION', 'SENTINEL_AI_INTERPRETATION']) {
      expect(payload).not.toContain(sentinel);
    }
  });

  it('does not announce anything when the user closes the native share sheet (AbortError)', async () => {
    const abortError = Object.assign(new Error('cancelled'), { name: 'AbortError' });
    const share = jest.fn().mockRejectedValue(abortError);
    Object.defineProperty(navigator, 'share', { value: share, configurable: true });
    const user = userEvent.setup();

    render(<ShareButton />);
    await user.click(screen.getByRole('button', { name: `Share ${SITE_NAME}` }));

    await waitFor(() => expect(share).toHaveBeenCalled());
    expect(toast.error).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('falls back to clipboard and communicates success accessibly when Web Share is unavailable', async () => {
    // Explicitly force navigator.share undefined rather than relying only on afterEach's
    // cleanup — guarantees the fallback branch runs regardless of jsdom's own Web Share stubbing.
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
    // jsdom provides its own real `navigator.clipboard` (Clipboard/EventTarget) object — replacing
    // it wholesale via Object.defineProperty doesn't reach the instance the component actually
    // reads from. Spy on the existing method instead, the same object the component calls.
    const writeText = jest.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(<ShareButton />);
    await user.click(screen.getByRole('button', { name: `Share ${SITE_NAME}` }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith(SITE_URL));
    expect(toast.success).toHaveBeenCalledWith('Link copied to clipboard.');
  });

  it('communicates clipboard failure accessibly, not silently', async () => {
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
    jest.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('denied'));
    const user = userEvent.setup();

    render(<ShareButton />);
    await user.click(screen.getByRole('button', { name: `Share ${SITE_NAME}` }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Couldn't copy the link. Please try again."));
  });
});
