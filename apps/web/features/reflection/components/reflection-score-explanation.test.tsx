import { render, screen } from '@testing-library/react';
import { ReflectionScoreExplanation } from './reflection-score-explanation';

describe('ReflectionScoreExplanation', () => {
  it('never renders the raw score without its explanation alongside it', () => {
    render(<ReflectionScoreExplanation score={62} explanation={['Recently observed (+20).', 'Relates to one of your goals (+15).']} />);
    expect(screen.getByText('62')).toBeInTheDocument();
    expect(screen.getByText('Recently observed (+20).')).toBeInTheDocument();
    expect(screen.getByText('Relates to one of your goals (+15).')).toBeInTheDocument();
  });

  it('shows an honest empty state instead of fabricating a reason', () => {
    render(<ReflectionScoreExplanation score={0} explanation={[]} />);
    expect(screen.getByText('No scoring factors applied.')).toBeInTheDocument();
  });
});
