import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { AccessibilityInfo, Alert } from 'react-native';
import TarotScreen from '@/app/(tabs)/tarot';
import { tarotApi, type TarotReading } from './tarot-api';

jest.mock('./tarot-api', () => ({
  ...jest.requireActual('./tarot-api'),
  tarotApi: {
    readings: jest.fn(),
    reading: jest.fn(),
    selectionSession: jest.fn(),
    draw: jest.fn(),
    archive: jest.fn(),
    restore: jest.fn(),
    remove: jest.fn(),
    interpret: jest.fn(),
  },
}));
jest.mock('@/providers/auth-provider', () => ({ useAuth: () => ({ status: 'authenticated' }) }));
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('@/components/app-header', () => ({ AppHeader: () => null }));
// Motion is verified independently in tarot-motion.test.tsx. Keep this screen suite
// focused on API/state transitions rather than mounting 78 animated card wrappers.
jest.mock('@/features/tarot/tarot-motion', () => ({
  TarotMotion: ({ children }: { children: React.ReactNode }) => children,
  TarotShuffle: () => null,
  useReducedMotion: () => true,
}));
jest.mock('@/components/screen', () => ({
  Screen: ({ children }: { children: React.ReactNode }) => children,
}));
// Cold native Image rendering of all 78 slots can exceed 5s on Windows.
jest.setTimeout(30000);

const api = tarotApi as jest.Mocked<typeof tarotApi>;
const reading: TarotReading = {
  id: 'server-reading',
  type: 'DAILY_DRAW',
  status: 'ACTIVE',
  cards: [{ position: 0, positionLabel: null, isReversed: false, card: { nameVi: 'Server card' } }],
  interpretation: 'Server interpretation',
};

beforeEach(() => {
  jest.resetAllMocks();
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
  jest.spyOn(AccessibilityInfo, 'addEventListener').mockReturnValue({ remove: jest.fn() });
  api.readings.mockResolvedValue({ items: [] });
  api.selectionSession.mockResolvedValue({ token: 'server-selection-token-123456' });
  api.draw.mockResolvedValue(reading);
  api.reading.mockResolvedValue(reading);
});

async function select() {
  const ui = await render(<TarotScreen />);
  await fireEvent.press(ui.getByText('Xáo bài'));
  await waitFor(() => expect(ui.getByLabelText('Lá úp vị trí 1')).toBeTruthy());
  await fireEvent.press(ui.getByLabelText('Lá úp vị trí 1'));
  return ui;
}

it('reveals only backend cards and submits only chosen positions', async () => {
  const ui = await select();
  expect(ui.queryByText(/Server card/)).toBeNull();
  await fireEvent.press(ui.getByText('Lật bài và nhận luận giải'));
  await waitFor(() => expect(ui.getByText(/Server card/)).toBeTruthy());
  expect(api.draw).toHaveBeenCalledWith('DAILY_DRAW', 'server-selection-token-123456', [0], '');
  expect(ui.queryByLabelText('Lá úp vị trí 1')).toBeNull();
});

it.each([
  'Token expired',
  'Token already used',
  'Network request failed',
  'Daily draw limit reached',
])('displays %s and requires a new shuffle without retrying the token', async (message) => {
  api.draw.mockRejectedValueOnce(new Error(message));
  const ui = await select();
  await fireEvent.press(ui.getByText('Lật bài và nhận luận giải'));
  await waitFor(() => expect(ui.getByText(message)).toBeTruthy());
  expect(ui.queryByLabelText('Lá úp vị trí 1')).toBeNull();
  expect(ui.queryByText(/Server card/)).toBeNull();
  expect(api.draw).toHaveBeenCalledTimes(1);
  await fireEvent.press(ui.getByText('Xáo bài'));
  await waitFor(() => expect(ui.getByLabelText('Lá úp vị trí 1')).toBeTruthy());
  expect(api.selectionSession).toHaveBeenCalledTimes(2);
});

it('handles selection-session API errors without exposing the deck', async () => {
  api.selectionSession.mockRejectedValue(new Error('Session unavailable'));
  const ui = await render(<TarotScreen />);
  await fireEvent.press(ui.getByText('Xáo bài'));
  await waitFor(() => expect(ui.getByText('Session unavailable')).toBeTruthy());
  expect(ui.queryByLabelText('Lá úp vị trí 1')).toBeNull();
});

it('synchronizes stateful history through archive, restore, confirmed deletion and restore', async () => {
  let stored = { ...reading };
  api.readings.mockImplementation(async (status = 'ACTIVE') => ({
    items: stored.status === status ? [{ ...stored }] : [],
  }));
  api.reading.mockImplementation(async () => ({ ...stored }));
  for (const [action, status] of [
    ['archive', 'ARCHIVED'],
    ['restore', 'ACTIVE'],
    ['remove', 'DELETED'],
  ] as const) {
    api[action].mockImplementation(async () => {
      stored = { ...stored, status };
      return { ...stored };
    });
  }
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  const ui = await render(<TarotScreen />);
  const item = 'tarot-history-server-reading';
  async function ready() {
    await waitFor(() =>
      expect(ui.queryByLabelText('\u0110ang t\u1ea3i l\u1ecbch s\u1eed Tarot')).toBeNull(),
    );
  }
  async function switchFilter(label: string, present: boolean) {
    await fireEvent.press(ui.getByText(label));
    await ready();
    expect(Boolean(ui.queryByTestId(item))).toBe(present);
  }
  await waitFor(() => expect(ui.getByTestId(item)).toBeTruthy());
  await fireEvent.press(ui.getByTestId(item));
  await waitFor(() => expect(ui.getByText(/Server card/)).toBeTruthy());
  await fireEvent.press(ui.getAllByText('L\u01b0u tr\u1eef')[0]);
  await ready();
  expect(stored.status).toBe('ARCHIVED');
  expect(ui.queryByTestId(item)).toBeNull();
  await switchFilter('L\u01b0u tr\u1eef', true);
  await fireEvent.press(ui.getByText('Kh\u00f4i ph\u1ee5c'));
  await ready();
  expect(stored.status).toBe('ACTIVE');
  expect(ui.queryByTestId(item)).toBeNull();
  await switchFilter('Hi\u1ec7n t\u1ea1i', true);
  await fireEvent.press(ui.getByText('X\u00f3a'));
  expect(api.remove).not.toHaveBeenCalled();
  const buttons = alert.mock.calls[0][2]!;
  expect(buttons.find((button) => button.style === 'cancel')).toBeTruthy();
  await act(async () => {
    buttons.find((button) => button.style === 'destructive')!.onPress!();
  });
  await ready();
  expect(api.remove).toHaveBeenCalledTimes(1);
  expect(stored.status).toBe('DELETED');
  expect(ui.queryByTestId(item)).toBeNull();
  await switchFilter('\u0110\u00e3 x\u00f3a', true);
  await fireEvent.press(ui.getByText('Kh\u00f4i ph\u1ee5c'));
  await ready();
  expect(stored.status).toBe('ACTIVE');
  expect(ui.queryByTestId(item)).toBeNull();
  await switchFilter('Hi\u1ec7n t\u1ea1i', true);
  expect(api.restore).toHaveBeenCalledTimes(2);
  alert.mockRestore();
});

it('canceling delete preserves both the reading and ACTIVE history without a DELETE request', async () => {
  api.readings.mockResolvedValue({ items: [reading] });
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  const ui = await render(<TarotScreen />);
  await waitFor(() => expect(ui.getByTestId('tarot-history-server-reading')).toBeTruthy());
  await fireEvent.press(ui.getByTestId('tarot-history-server-reading'));
  await waitFor(() => expect(ui.getByText(/Server card/)).toBeTruthy());
  await fireEvent.press(ui.getByText('X\u00f3a'));
  const cancel = alert.mock.calls[0][2]!.find((button) => button.style === 'cancel')!;
  expect(cancel.text).toBe('H\u1ee7y');
  await act(async () => {
    cancel.onPress?.();
  });
  expect(api.remove).not.toHaveBeenCalled();
  expect(ui.getByTestId('tarot-history-server-reading')).toBeTruthy();
  expect(ui.getByText(/Server card/)).toBeTruthy();
  alert.mockRestore();
});

it('shows history API errors and supports retry through filters', async () => {
  api.readings.mockRejectedValueOnce(new Error('History unavailable'));
  const ui = await render(<TarotScreen />);
  await waitFor(() => expect(ui.getByText('History unavailable')).toBeTruthy());
  await fireEvent.press(ui.getByText('Lưu trữ'));
  await waitFor(() => expect(api.readings).toHaveBeenLastCalledWith('ARCHIVED'));
});

it.each(['archive', 'restore', 'remove', 'interpret', 'reading'] as const)(
  'preserves the reading on %s API failure',
  async (name) => {
    api.readings.mockResolvedValue({ items: [reading] });
    api.reading.mockResolvedValue({
      ...reading,
      interpretation: null,
      status: name === 'restore' ? 'ARCHIVED' : 'ACTIVE',
    });
    api[name].mockRejectedValueOnce(new Error('API unavailable'));
    const alert = jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons) => {
      buttons?.find((button) => button.style === 'destructive')?.onPress?.();
    });
    const ui = await render(<TarotScreen />);
    await waitFor(() => expect(ui.getByText('Xem trải bài')).toBeTruthy());
    await fireEvent.press(ui.getByText('Xem trải bài'));
    if (name !== 'reading') {
      await waitFor(() => expect(ui.getByText(/Server card/)).toBeTruthy());
      await fireEvent.press(
        ui.getAllByText(
          { archive: 'Lưu trữ', restore: 'Khôi phục', remove: 'Xóa', interpret: 'Luận giải lại' }[
            name
          ],
        )[0],
      );
    }
    await waitFor(() => expect(ui.getByText('API unavailable')).toBeTruthy());
    if (name !== 'reading') expect(ui.getByText(/Server card/)).toBeTruthy();
    alert.mockRestore();
  },
);

it('rejects stale history responses after switching filters', async () => {
  let resolveOld: (value: { items: TarotReading[] }) => void = () => {};
  api.readings.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        resolveOld = resolve;
      }),
  );
  const ui = await render(<TarotScreen />);
  await waitFor(() => expect(api.readings).toHaveBeenCalledWith('ACTIVE'));
  await fireEvent.press(ui.getByText('L\u01b0u tr\u1eef'));
  await waitFor(() => expect(api.readings).toHaveBeenCalledWith('ARCHIVED'));
  await act(async () => {
    resolveOld({ items: [reading] });
  });
  expect(ui.queryByText('Xem tr\u1ea3i b\u00e0i')).toBeNull();
});

it('distinguishes pending, error, retry and genuine empty history', async () => {
  let reject: (error: Error) => void = () => {};
  api.readings.mockImplementationOnce(
    () =>
      new Promise((_resolve, fail) => {
        reject = fail;
      }),
  );
  const ui = await render(<TarotScreen />);
  const loading = '\u0110ang t\u1ea3i l\u1ecbch s\u1eed Tarot';
  const empty = 'Ch\u01b0a c\u00f3 tr\u1ea3i b\u00e0i trong m\u1ee5c n\u00e0y.';
  expect(ui.getByLabelText(loading)).toBeTruthy();
  expect(ui.queryByText(empty)).toBeNull();
  await act(async () => {
    reject(new Error('History offline'));
  });
  expect(ui.queryByLabelText(loading)).toBeNull();
  expect(ui.getByText('History offline')).toBeTruthy();
  expect(ui.queryByText(empty)).toBeNull();
  await fireEvent.press(ui.getByText('Th\u1eed l\u1ea1i l\u1ecbch s\u1eed'));
  await waitFor(() => expect(ui.getByText(empty)).toBeTruthy());
  expect(ui.queryByText('History offline')).toBeNull();
  expect(api.readings).toHaveBeenCalledTimes(2);
});

it('ignores a stale error while a newer filter is still loading', async () => {
  let rejectOld: (error: Error) => void = () => {};
  let resolveNew: (value: { items: TarotReading[] }) => void = () => {};
  api.readings.mockImplementationOnce(
    () =>
      new Promise((_resolve, reject) => {
        rejectOld = reject;
      }),
  );
  api.readings.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        resolveNew = resolve;
      }),
  );
  const ui = await render(<TarotScreen />);
  await waitFor(() => expect(api.readings).toHaveBeenCalledWith('ACTIVE'));
  await fireEvent.press(ui.getByText('L\u01b0u tr\u1eef'));
  await waitFor(() => expect(api.readings).toHaveBeenCalledWith('ARCHIVED'));
  await act(async () => {
    rejectOld(new Error('Old filter error'));
  });
  expect(ui.queryByText('Old filter error')).toBeNull();
  expect(ui.getByLabelText('\u0110ang t\u1ea3i l\u1ecbch s\u1eed Tarot')).toBeTruthy();
  await act(async () => {
    resolveNew({ items: [{ ...reading, status: 'ARCHIVED' }] });
  });
  expect(ui.getByTestId('tarot-history-server-reading')).toBeTruthy();
});
