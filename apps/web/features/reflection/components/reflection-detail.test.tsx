import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithQuery } from '@/test/render-with-query';
import { ReflectionDetail } from './reflection-detail';
import { reflectionApi } from '../api/reflection-api';

jest.mock('../api/reflection-api', () => ({
  reflectionApi: { get: jest.fn(), archive: jest.fn(), dismiss: jest.fn() },
}));

const candidate = {
  id: 'r1',
  category: 'GOAL' as const,
  trigger: 'REPEATED_GOAL' as const,
  state: 'READY' as const,
  window: 'WEEK' as const,
  windowStart: '2026-01-01T00:00:00.000Z',
  windowEnd: '2026-01-05T00:00:00.000Z',
  reason: 'You’ve returned to a similar goal.',
  score: 70,
  scoreExplanation: ['You pinned this reflection.'],
  groupKey: 'GOAL:marathon',
  visibility: 'COMPANION_VISIBLE' as const,
  pinned: true,
  sources: [{ sourceType: 'MEMORY' as const, sourceId: 'm1', sourceTimestamp: '2026-01-01T00:00:00.000Z' }],
  createdAt: '2026-01-05T00:00:00.000Z',
  updatedAt: '2026-01-05T00:00:00.000Z',
  resolvedAt: null,
  expiredAt: null,
};

describe('ReflectionDetail', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders the reason, score explanation, and real sources for a READY candidate', async () => {
    (reflectionApi.get as jest.Mock).mockResolvedValue(candidate);
    renderWithQuery(<ReflectionDetail id="r1" onClose={jest.fn()} />);
    expect(await screen.findByText('You’ve returned to a similar goal.')).toBeInTheDocument();
    expect(screen.getByText('You pinned this reflection.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Dismiss' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Archive' })).toBeInTheDocument();
  });

  it('Dismiss calls the API and closes on success', async () => {
    (reflectionApi.get as jest.Mock).mockResolvedValue(candidate);
    (reflectionApi.dismiss as jest.Mock).mockResolvedValue({ ...candidate, state: 'DISMISSED' });
    const onClose = jest.fn();
    const user = userEvent.setup();
    renderWithQuery(<ReflectionDetail id="r1" onClose={onClose} />);
    await screen.findByText('You’ve returned to a similar goal.');

    await user.click(screen.getByRole('button', { name: 'Dismiss' }));

    await waitFor(() => expect(reflectionApi.dismiss).toHaveBeenCalledWith('r1'));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('Archive calls the API and closes on success', async () => {
    (reflectionApi.get as jest.Mock).mockResolvedValue(candidate);
    (reflectionApi.archive as jest.Mock).mockResolvedValue({ ...candidate, state: 'ARCHIVED' });
    const onClose = jest.fn();
    const user = userEvent.setup();
    renderWithQuery(<ReflectionDetail id="r1" onClose={onClose} />);
    await screen.findByText('You’ve returned to a similar goal.');

    await user.click(screen.getByRole('button', { name: 'Archive' }));

    await waitFor(() => expect(reflectionApi.archive).toHaveBeenCalledWith('r1'));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('a resolved candidate shows no Dismiss/Archive actions', async () => {
    (reflectionApi.get as jest.Mock).mockResolvedValue({ ...candidate, state: 'DISMISSED' });
    renderWithQuery(<ReflectionDetail id="r1" onClose={jest.fn()} />);
    await screen.findByText('You’ve returned to a similar goal.');
    expect(screen.queryByRole('button', { name: 'Dismiss' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Archive' })).not.toBeInTheDocument();
    expect(screen.getByText('You dismissed this reflection.')).toBeInTheDocument();
  });
});
