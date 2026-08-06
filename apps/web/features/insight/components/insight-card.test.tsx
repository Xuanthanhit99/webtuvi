import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@testing-library/react';
import type { InsightCardDto } from '@beaconvie/types';
import { InsightCard } from './insight-card';

const card: InsightCardDto = {
  id: 'i1',
  category: { value: 'GOAL', label: 'Goal' },
  status: { value: 'READY', label: 'Ready' },
  window: 'WEEK',
  windowStart: '2026-01-01T00:00:00.000Z',
  windowEnd: '2026-01-05T00:00:00.000Z',
  reason: {
    headline: '2 reflections connected by SUPPORTS relationships.',
    whyItMatters: ['Relates to a goal (+15).'],
    evidenceSummary: 'Backed by 2 reflections, connected by 1 relationship.',
  },
  priorityBadge: { tier: 'HIGH', label: 'High priority', priority: 82 },
  evidenceCount: 2,
  relationshipCount: 1,
  pinned: false,
  createdAt: '2026-01-05T00:00:00.000Z',
  updatedAt: '2026-01-05T00:00:00.000Z',
  resolvedAt: null,
};

describe('InsightCard', () => {
  it('renders the real category/status/priority labels and reason — never fabricated wording', () => {
    render(<InsightCard card={card} onSelect={jest.fn()} />);
    expect(screen.getByText('Goal')).toBeInTheDocument();
    expect(screen.getByText('Ready')).toBeInTheDocument();
    expect(screen.getByText('High priority')).toBeInTheDocument();
    expect(screen.getByText('2 reflections connected by SUPPORTS relationships.')).toBeInTheDocument();
    expect(screen.getByText(/Backed by 2 reflections, connected by 1 relationship\./)).toBeInTheDocument();
  });

  it('clicking the card calls onSelect with its real id', async () => {
    const onSelect = jest.fn();
    const user = userEvent.setup();
    render(<InsightCard card={card} onSelect={onSelect} />);
    await user.click(screen.getByText('2 reflections connected by SUPPORTS relationships.'));
    expect(onSelect).toHaveBeenCalledWith('i1');
  });

  it('shows a pin toggle when onTogglePin is provided, and calls it with the card', async () => {
    const onTogglePin = jest.fn();
    const user = userEvent.setup();
    render(<InsightCard card={card} onSelect={jest.fn()} onTogglePin={onTogglePin} />);
    const pinButton = screen.getByRole('button', { name: 'Pin insight' });
    await user.click(pinButton);
    expect(onTogglePin).toHaveBeenCalledWith(card);
  });

  it('a pinned card shows an "Unpin insight" control instead', () => {
    render(<InsightCard card={{ ...card, pinned: true }} onSelect={jest.fn()} onTogglePin={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'Unpin insight' })).toBeInTheDocument();
  });

  it('no pin toggle renders when onTogglePin is omitted', () => {
    render(<InsightCard card={card} onSelect={jest.fn()} />);
    expect(screen.queryByRole('button', { name: /pin insight/i })).not.toBeInTheDocument();
  });
});
