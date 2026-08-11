import { screen } from '@testing-library/react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { NumerologyValueDto } from '@beaconvie/types';
import { NumerologyValueCard } from './numerology-value-card';

const nameBasedEntry: NumerologyValueDto = {
  type: 'EXPRESSION',
  value: 7,
  isMasterNumber: false,
  appliesToYear: null,
  order: 1,
  breakdown: {
    normalizedName: 'NGUYEN VAN A',
    letters: [
      { char: 'N', value: 5 },
      { char: 'G', value: 7 },
    ],
    sum: 43,
    reduction: { value: 7, isMasterNumber: false, steps: [{ from: 43, digits: [4, 3], to: 7 }] },
  },
};

const masterEntry: NumerologyValueDto = {
  type: 'PERSONALITY',
  value: 33,
  isMasterNumber: true,
  appliesToYear: null,
  order: 3,
  breakdown: {
    normalizedName: 'NGUYEN VAN A',
    letters: [{ char: 'N', value: 5 }],
    sum: 33,
    reduction: { value: 33, isMasterNumber: true, steps: [] },
  },
};

describe('NumerologyValueCard', () => {
  it('shows the real calculated value and label, with calculation steps collapsed by default', () => {
    render(<NumerologyValueCard entry={nameBasedEntry} meaning={undefined} />);
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('Expression')).toBeInTheDocument();
    expect(screen.queryByText(/Sum: 5 \+ 7/)).not.toBeInTheDocument();
  });

  it('expanding reveals the real digit-sum steps — never AI-generated text', async () => {
    const user = userEvent.setup();
    render(<NumerologyValueCard entry={nameBasedEntry} meaning={undefined} />);
    await user.click(screen.getByRole('button', { name: /why is my number 7/i }));
    expect(screen.getByText(/Sum: 5 \+ 7 = 43/)).toBeInTheDocument();
    expect(screen.getByText(/43 → 4 \+ 3 = 7/)).toBeInTheDocument();
  });

  it('a Master Number value shows the Master Number badge and explains it is never reduced further', async () => {
    const user = userEvent.setup();
    render(<NumerologyValueCard entry={masterEntry} meaning={undefined} />);
    expect(screen.getByText('33')).toBeInTheDocument();
    expect(screen.getByText('Master Number')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /why is my number 33/i }));
    expect(screen.getByText(/kept as-is instead of being reduced further/i)).toBeInTheDocument();
  });

  it('shows the real traditional meaning when provided, never invented client-side', () => {
    render(
      <NumerologyValueCard
        entry={nameBasedEntry}
        meaning={{ type: 'EXPRESSION', value: 7, isMasterNumber: false, title: 'The Seeker', framing: 'Your Expression Number...', meaning: 'Introspection and analysis.' }}
      />,
    );
    expect(screen.getByText('The Seeker.')).toBeInTheDocument();
    expect(screen.getByText('Introspection and analysis.')).toBeInTheDocument();
  });
});
