import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithQuery } from '@/test/render-with-query';
import { MemoryDetail } from './memory-detail';
import { memoryApi } from '../api/memory-api';

jest.mock('../api/memory-api', () => ({
  memoryApi: {
    get: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    archive: jest.fn(),
    restore: jest.fn(),
    versions: jest.fn(),
    auditTrail: jest.fn(),
  },
}));

const MEMORY = {
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
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  archivedAt: null,
};

describe('MemoryDetail', () => {
  it('shows an error state when the memory cannot be found', async () => {
    (memoryApi.get as jest.Mock).mockRejectedValue(new Error('not found'));

    renderWithQuery(<MemoryDetail memoryId="mem-1" onClose={jest.fn()} />);

    expect(await screen.findByText(/couldn.t be found/i)).toBeInTheDocument();
  });

  it('renders the memory’s title and summary', async () => {
    (memoryApi.get as jest.Mock).mockResolvedValue(MEMORY);

    renderWithQuery(<MemoryDetail memoryId="mem-1" onClose={jest.fn()} />);

    expect(await screen.findByText('New job')).toBeInTheDocument();
    expect(screen.getByText('Starting a new job next week.')).toBeInTheDocument();
  });

  it('editing the title calls update() with only the title', async () => {
    (memoryApi.get as jest.Mock).mockResolvedValue(MEMORY);
    (memoryApi.update as jest.Mock).mockResolvedValue({ ...MEMORY, title: 'Renamed', version: 2 });
    const user = userEvent.setup();

    renderWithQuery(<MemoryDetail memoryId="mem-1" onClose={jest.fn()} />);
    await user.click(await screen.findByRole('button', { name: /rename memory/i }));
    const input = screen.getByLabelText(/memory title/i);
    await user.clear(input);
    await user.type(input, 'Renamed');
    await user.click(screen.getByRole('button', { name: /^save$/i }));

    await waitFor(() => expect(memoryApi.update).toHaveBeenCalledWith('mem-1', { title: 'Renamed' }));
  });

  it('shows a delete confirmation dialog before deleting', async () => {
    (memoryApi.get as jest.Mock).mockResolvedValue(MEMORY);
    (memoryApi.remove as jest.Mock).mockResolvedValue(undefined);
    const onClose = jest.fn();
    const user = userEvent.setup();

    renderWithQuery(<MemoryDetail memoryId="mem-1" onClose={onClose} />);
    await user.click(await screen.findByRole('button', { name: /^delete$/i }));
    expect(screen.getByText(/permanently deletes it/i)).toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: /^delete$/i })[1]!);

    await waitFor(() => expect(memoryApi.remove).toHaveBeenCalledWith('mem-1'));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('archiving shows a Restore action afterward', async () => {
    (memoryApi.get as jest.Mock).mockResolvedValue(MEMORY);
    (memoryApi.archive as jest.Mock).mockResolvedValue({ ...MEMORY, status: 'ARCHIVED', archivedAt: '2026-01-02T00:00:00.000Z' });
    const user = userEvent.setup();

    renderWithQuery(<MemoryDetail memoryId="mem-1" onClose={jest.fn()} />);
    await user.click(await screen.findByRole('button', { name: /^archive$/i }));

    expect(await screen.findByRole('button', { name: /restore/i })).toBeInTheDocument();
  });

  it('toggles version history on demand', async () => {
    (memoryApi.get as jest.Mock).mockResolvedValue(MEMORY);
    (memoryApi.versions as jest.Mock).mockResolvedValue([
      { version: 1, title: 'New job', summary: 'x', visibility: 'PRIVATE', changeReason: 'created', createdAt: '2026-01-01T00:00:00.000Z' },
    ]);
    const user = userEvent.setup();

    renderWithQuery(<MemoryDetail memoryId="mem-1" onClose={jest.fn()} />);
    await user.click(await screen.findByRole('button', { name: /show version history/i }));

    expect(await screen.findByText(/v1/)).toBeInTheDocument();
  });
});
