import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as Sentry from '@sentry/nextjs';
import GlobalError from './global-error';

jest.mock('@sentry/nextjs', () => ({ captureException: jest.fn() }));

describe('GlobalError (Sprint 12 root-level boundary)', () => {
  it('reports the error to Sentry', () => {
    const error = Object.assign(new Error('root layout exploded'), { digest: 'abc123' });
    render(<GlobalError error={error} reset={jest.fn()} />);
    expect(Sentry.captureException).toHaveBeenCalledWith(error);
  });

  it('shows a user-understandable message, never a stack trace or technical detail', () => {
    const error = Object.assign(new Error('TypeError: cannot read property x of undefined'), {});
    render(<GlobalError error={error} reset={jest.fn()} />);
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    expect(screen.queryByText(/TypeError/)).not.toBeInTheDocument();
    expect(screen.queryByText(/cannot read property/i)).not.toBeInTheDocument();
  });

  it('offers a working retry affordance that calls reset()', async () => {
    const user = userEvent.setup();
    const reset = jest.fn();
    const error = Object.assign(new Error('boom'), {});
    render(<GlobalError error={error} reset={reset} />);

    await user.click(screen.getByRole('button', { name: /try again/i }));

    expect(reset).toHaveBeenCalledTimes(1);
  });
});
