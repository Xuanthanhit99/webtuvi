import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithQuery } from '@/test/render-with-query';
import { ReflectionFeed } from './reflection-feed';
import { reflectionApi } from '../api/reflection-api';

jest.mock('../api/reflection-api', () => ({
  reflectionApi: { feed: jest.fn() },
}));

const candidate = {
  id: 'r1',
  category: 'TOPIC' as const,
  trigger: 'REPEATED_TOPIC' as const,
  state: 'READY' as const,
  window: 'WEEK' as const,
  windowStart: '2026-01-01T00:00:00.000Z',
  windowEnd: '2026-01-05T00:00:00.000Z',
  reason: 'You mentioned pottery a few times.',
  score: 55,
  scoreExplanation: ['Recently observed (+20).'],
  groupKey: 'TOPIC:pottery',
  visibility: 'COMPANION_VISIBLE' as const,
  pinned: false,
  sources: [{ sourceType: 'JOURNAL' as const, sourceId: 'j1', sourceTimestamp: '2026-01-01T00:00:00.000Z' }],
  createdAt: '2026-01-05T00:00:00.000Z',
  updatedAt: '2026-01-05T00:00:00.000Z',
  resolvedAt: null,
  expiredAt: null,
};

describe('ReflectionFeed', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows an honest empty state when there are no active reflections', async () => {
    (reflectionApi.feed as jest.Mock).mockResolvedValue([]);
    renderWithQuery(<ReflectionFeed onSelect={jest.fn()} />);
    expect(await screen.findByText('Nothing to reflect on yet')).toBeInTheDocument();
  });

  it('renders the real reason and score for each candidate — never AI wording', async () => {
    (reflectionApi.feed as jest.Mock).mockResolvedValue([candidate]);
    renderWithQuery(<ReflectionFeed onSelect={jest.fn()} />);
    expect(await screen.findByText('You mentioned pottery a few times.')).toBeInTheDocument();
    expect(screen.getByText('Score 55')).toBeInTheDocument();
  });

  it('selecting a candidate calls onSelect with its real id', async () => {
    (reflectionApi.feed as jest.Mock).mockResolvedValue([candidate]);
    const onSelect = jest.fn();
    const user = userEvent.setup();
    renderWithQuery(<ReflectionFeed onSelect={onSelect} />);
    await screen.findByText('You mentioned pottery a few times.');
    await user.click(screen.getByText('You mentioned pottery a few times.'));
    expect(onSelect).toHaveBeenCalledWith('r1');
  });

  it('shows an error state with retry when the feed fails to load', async () => {
    (reflectionApi.feed as jest.Mock).mockRejectedValue(new Error('network'));
    renderWithQuery(<ReflectionFeed onSelect={jest.fn()} />);
    await waitFor(() => expect(screen.getByText(/couldn.t load your reflections/i)).toBeInTheDocument());
  });
});
