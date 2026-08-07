import { render, screen } from '@testing-library/react';
import type { ReviewEvidenceDto } from '@beaconvie/types';
import { ReviewEvidenceList } from './review-evidence-list';

const insightEvidence: ReviewEvidenceDto = {
  sourceType: 'INSIGHT',
  sourceId: 'i1',
  category: 'GOAL',
  priority: 80,
  sourceTimestamp: '2026-01-01T00:00:00.000Z',
  contribution: 'Insight: 3 reflections connected by SUPPORTS relationships. (priority 80).',
  href: '/insights?item=i1',
};

const memoryEvidence: ReviewEvidenceDto = {
  sourceType: 'MEMORY',
  sourceId: 'm1',
  category: 'GOAL',
  priority: 35,
  sourceTimestamp: '2026-01-02T00:00:00.000Z',
  contribution: 'Memory: Ran a 5k (importance 35).',
  href: '/memory?item=m1',
};

describe('ReviewEvidenceList', () => {
  it('renders nothing for an empty evidence list — never a fabricated placeholder', () => {
    const { container } = render(<ReviewEvidenceList evidence={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the real contribution text and links back to the real source', () => {
    render(<ReviewEvidenceList evidence={[insightEvidence]} />);
    expect(screen.getByText(insightEvidence.contribution)).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/insights?item=i1');
    expect(screen.getByText('INSIGHT')).toBeInTheDocument();
    expect(screen.getByText('Goal')).toBeInTheDocument();
  });

  it('derives the priority-tier badge from the real priority number, never a separate field', () => {
    render(<ReviewEvidenceList evidence={[insightEvidence, memoryEvidence]} />);
    expect(screen.getByText('High priority')).toBeInTheDocument();
    expect(screen.getByText('Low priority')).toBeInTheDocument();
  });

  it('links a MEMORY item back to its real memory detail view', () => {
    render(<ReviewEvidenceList evidence={[memoryEvidence]} />);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/memory?item=m1');
  });
});
