import { render, screen } from '@testing-library/react';
import { Button } from './button';

describe('Button', () => {
  it('disables itself and exposes aria-busy while loading', () => {
    render(<Button loading>Save</Button>);
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  it('is not disabled or busy by default', () => {
    render(<Button>Save</Button>);
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).not.toBeDisabled();
    expect(button).not.toHaveAttribute('aria-busy');
  });
});
