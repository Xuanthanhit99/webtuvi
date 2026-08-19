import { render, screen, fireEvent } from '@testing-library/react';
import { MarketingHeader } from './marketing-header';

// jsdom does not implement the browser's native "click <summary> toggles <details>.open"
// default action (a known jsdom gap — verified live against a real browser during the audit that
// precedes this fix). These tests drive `.open`/the native `toggle` event directly so they exercise
// this component's own Escape/outside-click logic and its onToggle→aria-expanded sync, independent
// of that jsdom gap.
function getDetails(container: HTMLElement) {
  return container.querySelector('details') as HTMLDetailsElement;
}

function getSummary() {
  return screen.getByLabelText(/menu/i, { selector: 'summary' });
}

function openMenu(container: HTMLElement) {
  const details = getDetails(container);
  details.open = true;
  fireEvent(details, new Event('toggle'));
}

describe('MarketingHeader — mobile menu dismiss', () => {
  it('reflects open state via aria-expanded/aria-label when toggled', () => {
    const { container } = render(<MarketingHeader />);
    expect(getSummary()).toHaveAttribute('aria-expanded', 'false');
    expect(getSummary()).toHaveAttribute('aria-label', 'Open menu');

    openMenu(container);

    expect(getSummary()).toHaveAttribute('aria-expanded', 'true');
    expect(getSummary()).toHaveAttribute('aria-label', 'Close menu');
  });

  it('closes on Escape — regression for the confirmed no-Escape-dismiss bug', () => {
    const { container } = render(<MarketingHeader />);
    openMenu(container);
    expect(getDetails(container).open).toBe(true);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(getDetails(container).open).toBe(false);
    expect(getSummary()).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes on an outside click — regression for the confirmed no-outside-click-dismiss bug', () => {
    const { container } = render(<MarketingHeader />);
    openMenu(container);
    expect(getDetails(container).open).toBe(true);

    fireEvent.pointerDown(document.body);

    expect(getDetails(container).open).toBe(false);
  });

  it('does not close from a pointerdown on a link inside the open menu', () => {
    const { container } = render(<MarketingHeader />);
    openMenu(container);
    const insideLink = getDetails(container).querySelector('a')!;

    fireEvent.pointerDown(insideLink);

    expect(getDetails(container).open).toBe(true);
  });

  it('cleans up its document-level listeners on unmount', () => {
    const { container, unmount } = render(<MarketingHeader />);
    openMenu(container);
    unmount();

    // Should not throw / should not affect anything post-unmount — proves the effect cleanup runs.
    expect(() => fireEvent.keyDown(document, { key: 'Escape' })).not.toThrow();
  });
});
