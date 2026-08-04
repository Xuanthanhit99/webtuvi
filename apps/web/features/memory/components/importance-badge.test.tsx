import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImportanceBadge } from './importance-badge';

describe('ImportanceBadge', () => {
  it('never shows the raw score until "Why?" is expanded', () => {
    render(<ImportanceBadge score={82} explanations={['You pinned this memory.']} />);
    expect(screen.queryByText(/82/)).not.toBeInTheDocument();
  });

  it('shows the score alongside its explanations once expanded', async () => {
    const user = userEvent.setup();
    render(<ImportanceBadge score={82} explanations={['You pinned this memory.']} />);

    await user.click(screen.getByRole('button', { name: /why\?/i }));

    expect(screen.getByText('Importance: 82/100')).toBeInTheDocument();
    expect(screen.getByText('You pinned this memory.')).toBeInTheDocument();
  });

  it('shows a Pinned badge when pinned', () => {
    render(<ImportanceBadge score={82} explanations={[]} pinned />);
    expect(screen.getByText('Pinned')).toBeInTheDocument();
  });

  it('renders a sensible tier label for each score band', () => {
    const { rerender } = render(<ImportanceBadge score={80} explanations={[]} />);
    expect(screen.getByText('Important')).toBeInTheDocument();

    rerender(<ImportanceBadge score={50} explanations={[]} />);
    expect(screen.getByText('Notable')).toBeInTheDocument();

    rerender(<ImportanceBadge score={10} explanations={[]} />);
    expect(screen.getByText('Background')).toBeInTheDocument();
  });

  it('does not throw when given no props at all (defensive defaults)', () => {
    expect(() => render(<ImportanceBadge />)).not.toThrow();
  });
});
