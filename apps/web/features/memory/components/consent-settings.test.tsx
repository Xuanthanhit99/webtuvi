import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithQuery } from '@/test/render-with-query';
import { ConsentSettings } from './consent-settings';
import { memoryApi } from '../api/memory-api';

jest.mock('../api/memory-api', () => ({
  memoryApi: {
    consents: {
      get: jest.fn(),
      updateGlobal: jest.fn(),
      updateType: jest.fn(),
    },
  },
}));

describe('ConsentSettings', () => {
  it('shows the global mode and no per-type rules by default', async () => {
    (memoryApi.consents.get as jest.Mock).mockResolvedValue({ globalMode: 'ASK_EVERY_TIME', typeOverrides: [] });

    renderWithQuery(<ConsentSettings />);

    expect(await screen.findByLabelText(/when beaconvie could remember something/i)).toHaveValue('ASK_EVERY_TIME');
    expect(screen.getByText(/no specific rules yet/i)).toBeInTheDocument();
  });

  it('shows existing per-type overrides', async () => {
    (memoryApi.consents.get as jest.Mock).mockResolvedValue({
      globalMode: 'ASK_EVERY_TIME',
      typeOverrides: [{ type: 'HEALTH', mode: 'ALLOW_TYPE' }],
    });

    renderWithQuery(<ConsentSettings />);

    expect(await screen.findByText(/health \(requires explicit permission\)/i)).toBeInTheDocument();
  });

  it('changing the global dropdown calls updateGlobal', async () => {
    (memoryApi.consents.get as jest.Mock).mockResolvedValue({ globalMode: 'ASK_EVERY_TIME', typeOverrides: [] });
    (memoryApi.consents.updateGlobal as jest.Mock).mockResolvedValue({ globalMode: 'DISABLED', typeOverrides: [] });
    const user = userEvent.setup();

    renderWithQuery(<ConsentSettings />);
    const select = await screen.findByLabelText(/when beaconvie could remember something/i);
    await user.selectOptions(select, 'DISABLED');

    await waitFor(() => expect(memoryApi.consents.updateGlobal).toHaveBeenCalledWith('DISABLED'));
  });

  it('mentions that HEALTH is never automatic', async () => {
    (memoryApi.consents.get as jest.Mock).mockResolvedValue({ globalMode: 'ALLOW_TYPE', typeOverrides: [] });

    renderWithQuery(<ConsentSettings />);

    expect(await screen.findByText(/health memories are never remembered automatically/i)).toBeInTheDocument();
  });
});
