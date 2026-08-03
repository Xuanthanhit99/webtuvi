import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithQuery } from '@/test/render-with-query';
import { MemoryTimeline } from './memory-timeline';
import { memoryApi } from '../api/memory-api';

jest.mock('../api/memory-api', () => ({
  memoryApi: {
    timeline: jest.fn(),
  },
}));

const ITEM = {
  id: 'mem-1',
  type: 'GOAL',
  title: 'New job',
  summary: 'Starting a new job next week.',
  structuredPayload: null,
  status: 'ACCEPTED',
  consentState: 'ALLOW_SELECTED',
  visibility: 'PRIVATE',
  sourceType: 'USER_EXPLICIT',
  sourceConversationId: 'c1',
  sourceMessageId: 'm1',
  version: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  archivedAt: null,
  group: 'today' as const,
  sourceAvailable: true,
  whyThisMemory: 'You asked BeaconVie to remember this.',
  consentExplanation: 'You allowed this specific memory.',
};

describe('MemoryTimeline', () => {
  it('shows an honest empty state when there are no memories', async () => {
    (memoryApi.timeline as jest.Mock).mockResolvedValue({ items: [], nextCursor: null });

    renderWithQuery(<MemoryTimeline onSelect={jest.fn()} />);

    expect(await screen.findByText('No memories yet.')).toBeInTheDocument();
  });

  it('renders memory items with their title, why-this-memory, and group heading', async () => {
    (memoryApi.timeline as jest.Mock).mockResolvedValue({ items: [ITEM], nextCursor: null });

    renderWithQuery(<MemoryTimeline onSelect={jest.fn()} />);

    expect(await screen.findByText('New job')).toBeInTheDocument();
    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText(ITEM.whyThisMemory)).toBeInTheDocument();
  });

  it('clicking an item calls onSelect with its id', async () => {
    (memoryApi.timeline as jest.Mock).mockResolvedValue({ items: [ITEM], nextCursor: null });
    const onSelect = jest.fn();
    const user = userEvent.setup();

    renderWithQuery(<MemoryTimeline onSelect={onSelect} />);
    await user.click(await screen.findByText('New job'));

    expect(onSelect).toHaveBeenCalledWith('mem-1');
  });

  it('shows a "Load more" button when a next cursor exists', async () => {
    (memoryApi.timeline as jest.Mock).mockResolvedValue({ items: [ITEM], nextCursor: '2026-01-01T00:00:00.000Z' });

    renderWithQuery(<MemoryTimeline onSelect={jest.fn()} />);

    expect(await screen.findByRole('button', { name: /load more/i })).toBeInTheDocument();
  });

  it('shows an error state with retry on failure', async () => {
    (memoryApi.timeline as jest.Mock).mockRejectedValue(new Error('network down'));

    renderWithQuery(<MemoryTimeline onSelect={jest.fn()} />);

    expect(await screen.findByRole('button', { name: /try again/i })).toBeInTheDocument();
  });
});
