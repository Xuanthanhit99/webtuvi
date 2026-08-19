import { render, screen } from '@testing-library/react';
import { Dialog } from './dialog';

describe('Dialog', () => {
  it('associates its own title via a unique aria-labelledby id', () => {
    render(<Dialog open onClose={() => {}} title="Delete this entry?" />);
    const dialog = screen.getByRole('dialog', { name: 'Delete this entry?' });
    const labelledBy = dialog.getAttribute('aria-labelledby');
    expect(labelledBy).toBeTruthy();
    expect(document.getElementById(labelledBy!)).toHaveTextContent('Delete this entry?');
  });

  it('associates its description via aria-describedby when a description is given', () => {
    render(<Dialog open onClose={() => {}} title="Delete this entry?" description="This cannot be undone." />);
    const dialog = screen.getByRole('dialog', { name: 'Delete this entry?' });
    const describedBy = dialog.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy!)).toHaveTextContent('This cannot be undone.');
  });

  it('omits aria-describedby entirely when no description is given, rather than pointing at an empty id', () => {
    render(<Dialog open onClose={() => {}} title="Delete this entry?" />);
    const dialog = screen.getByRole('dialog', { name: 'Delete this entry?' });
    expect(dialog).not.toHaveAttribute('aria-describedby');
  });

  it('gives two simultaneously-mounted Dialogs distinct title and description ids — regression for the id-collision bug', () => {
    render(
      <>
        <Dialog open onClose={() => {}} title="Sign out this device?" description="Only this session ends." />
        <Dialog open onClose={() => {}} title="Sign out of every device?" description="Every session ends, including this one." />
      </>,
    );

    const dialogs = screen.getAllByRole('dialog');
    expect(dialogs).toHaveLength(2);

    const [first, second] = dialogs as [HTMLElement, HTMLElement];
    const firstLabelledBy = first.getAttribute('aria-labelledby')!;
    const secondLabelledBy = second.getAttribute('aria-labelledby')!;
    const firstDescribedBy = first.getAttribute('aria-describedby')!;
    const secondDescribedBy = second.getAttribute('aria-describedby')!;

    // The actual regression: ids must not collide, and each dialog's own labelledby/describedby
    // must resolve to *its own* title/description text, not the other dialog's.
    expect(firstLabelledBy).not.toBe(secondLabelledBy);
    expect(firstDescribedBy).not.toBe(secondDescribedBy);
    expect(document.getElementById(firstLabelledBy)).toHaveTextContent('Sign out this device?');
    expect(document.getElementById(secondLabelledBy)).toHaveTextContent('Sign out of every device?');
    expect(document.getElementById(firstDescribedBy)).toHaveTextContent('Only this session ends.');
    expect(document.getElementById(secondDescribedBy)).toHaveTextContent('Every session ends, including this one.');
  });

  it('gives the close button a real accessible name', () => {
    render(<Dialog open onClose={() => {}} title="Delete this entry?" />);
    expect(screen.getByRole('button', { name: 'Close dialog' })).toBeInTheDocument();
  });
});
