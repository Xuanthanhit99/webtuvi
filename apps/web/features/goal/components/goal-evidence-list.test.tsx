import { render, screen } from '@testing-library/react';
import { GoalEvidenceList } from './goal-evidence-list';

describe('GoalEvidenceList', () => {
  it('renders each real evidence item with a working deep link back to its source', () => {
    render(
      <GoalEvidenceList
        evidence={[
          { sourceType: 'JOURNAL', sourceId: 'j1', sourceTimestamp: '2026-01-05T00:00:00.000Z', contribution: 'Journal entry tagged "spanish".', href: '/journal?item=j1' },
        ]}
      />,
    );
    expect(screen.getByText('Journal entry tagged "spanish".')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/journal?item=j1');
  });

  it('shows an honest empty state instead of fabricating evidence', () => {
    render(<GoalEvidenceList evidence={[]} />);
    expect(screen.getByText(/no evidence gathered yet/i)).toBeInTheDocument();
  });
});
