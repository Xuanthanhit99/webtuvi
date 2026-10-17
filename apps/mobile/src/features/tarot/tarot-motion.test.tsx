import { act, render } from '@testing-library/react-native';
import { AccessibilityInfo, Animated, StyleSheet, Text, View } from 'react-native';
import { TarotMotion, useReducedMotion } from './tarot-motion';

jest.setTimeout(30000);
let stops: jest.Mock[];
let timing: jest.SpyInstance;
beforeEach(() => {
  jest.useFakeTimers({ doNotFake: ['setImmediate', 'queueMicrotask'] });
  stops = [];
  timing = jest.spyOn(Animated, 'timing').mockImplementation((value, config) => {
    let timer: ReturnType<typeof setTimeout>;
    const stop = jest.fn(() => clearTimeout(timer));
    stops.push(stop);
    return {
      start: (callback?: (result: { finished: boolean }) => void) => {
        timer = setTimeout(() => {
          value.setValue(config.toValue as number);
          callback?.({ finished: true });
        }, config.duration);
      },
      stop,
      reset: jest.fn(),
    };
  });
});
afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});
async function advance(ms: number) {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
}
function card(index: number, reduced = false) {
  return (
    <TarotMotion mode="reveal" index={index} reduced={reduced}>
      <Text>Card {index}</Text>
    </TarotMotion>
  );
}
function rotation(node: { props: { style: unknown } }) {
  const value = StyleSheet.flatten(node.props.style as never).transform?.[1] as {
    rotateY: string | { __getValue: () => string };
  };
  return typeof value.rotateY === 'string' ? value.rotateY : value.rotateY.__getValue();
}

it('keeps three full backs and reveals fronts only at their sequential midpoints', async () => {
  const ui = await render(
    <View>
      {[0, 1, 2].map((index) => (
        <View key={index}>{card(index)}</View>
      ))}
    </View>,
  );
  for (const index of [0, 1, 2]) {
    expect(ui.queryByText(`Card ${index}`)).toBeNull();
    const back = ui.getByTestId(`tarot-back-${index}`);
    expect(rotation(back)).toBe('0deg');
    expect(StyleSheet.flatten(back.props.style).backfaceVisibility).toBe('hidden');
  }
  await advance(209);
  expect(ui.queryByText('Card 0')).toBeNull();
  await advance(1);
  expect(ui.getByText('Card 0')).toBeTruthy();
  expect(rotation(ui.getByTestId('tarot-front-0'))).toBe('90deg');
  expect(ui.queryByText('Card 1')).toBeNull();
  await advance(210);
  expect(rotation(ui.getByTestId('tarot-back-0', { includeHiddenElements: true }))).toBe('-180deg');
  expect(rotation(ui.getByTestId('tarot-front-0'))).toBe('0deg');
  await advance(309);
  expect(ui.queryByText('Card 1')).toBeNull();
  await advance(1);
  expect(ui.getByText('Card 1')).toBeTruthy();
  expect(ui.queryByText('Card 2')).toBeNull();
  await advance(519);
  expect(ui.queryByText('Card 2')).toBeNull();
  await advance(1);
  expect(ui.getByText('Card 2')).toBeTruthy();
});

it('cancels a pending reveal timer before unmount', async () => {
  const ui = await render(card(2));
  expect(jest.getTimerCount()).toBeGreaterThan(0);
  await ui.unmount();
  await advance(2000);
  expect(timing).not.toHaveBeenCalled();
  expect(jest.getTimerCount()).toBe(0);
});

it('stops an in-flight flip on unmount', async () => {
  const ui = await render(card(0));
  await advance(0);
  expect(timing).toHaveBeenCalledTimes(1);
  await ui.unmount();
  expect(stops[0]).toHaveBeenCalledTimes(1);
  await advance(1000);
  expect(timing).toHaveBeenCalledTimes(1);
});

it.each([0, 100, 250, 500])(
  'enabling Reduced Motion at %sms finishes immediately and never replays',
  async (ms) => {
    const ui = await render(card(0));
    await advance(ms);
    await ui.rerender(card(0, true));
    expect(ui.getByText('Card 0')).toBeTruthy();
    expect(rotation(ui.getByTestId('tarot-front-0'))).toBe('0deg');
    const calls = timing.mock.calls.length;
    await ui.rerender(card(0, false));
    await advance(2000);
    expect(ui.getByText('Card 0')).toBeTruthy();
    expect(rotation(ui.getByTestId('tarot-front-0'))).toBe('0deg');
    expect(timing).toHaveBeenCalledTimes(calls);
  },
);

it('finishes a waiting card on Reduced Motion and stays revealed when motion returns', async () => {
  const ui = await render(card(2));
  await ui.rerender(card(2, true));
  expect(ui.getByText('Card 2')).toBeTruthy();
  await ui.rerender(card(2));
  await advance(2000);
  expect(ui.getByText('Card 2')).toBeTruthy();
  expect(timing).not.toHaveBeenCalled();
});

it('does not restart on normal rerenders or when Reduced Motion is disabled after initial reveal', async () => {
  const ui = await render(card(2, true));
  await ui.rerender(card(2));
  await ui.rerender(card(2));
  await advance(2000);
  expect(ui.getByText('Card 2')).toBeTruthy();
  expect(timing).not.toHaveBeenCalled();
});

it('does not restart or postpone a pending or completed normal reveal on rerender', async () => {
  const ui = await render(card(1));
  await advance(300);
  await ui.rerender(card(1));
  await advance(430);
  expect(ui.getByText('Card 1')).toBeTruthy();
  await advance(210);
  await ui.rerender(card(1));
  await advance(1000);
  expect(timing).toHaveBeenCalledTimes(2);
});

it.each(['shuffle', 'select'] as const)(
  'stops %s animation on Reduced Motion and unmount',
  async (mode) => {
    const stop = jest.fn();
    const start = jest.fn();
    const method = mode === 'shuffle' ? 'loop' : 'spring';
    jest.spyOn(Animated, method).mockReturnValue({ start, stop, reset: jest.fn() });
    const ui = await render(
      <TarotMotion mode={mode} selected reduced={false}>
        <Text>Deck</Text>
      </TarotMotion>,
    );
    expect(start).toHaveBeenCalledTimes(1);
    await ui.rerender(
      <TarotMotion mode={mode} selected reduced>
        <Text>Deck</Text>
      </TarotMotion>,
    );
    expect(stop).toHaveBeenCalledTimes(1);
    await ui.rerender(
      <TarotMotion mode={mode} selected reduced={false}>
        <Text>Deck</Text>
      </TarotMotion>,
    );
    await ui.unmount();
    expect(stop).toHaveBeenCalledTimes(2);
  },
);

it('reads preferences, ignores a stale initial value and removes its listener', async () => {
  let listener: (enabled: boolean) => void = () => {};
  let resolve: (value: boolean) => void = () => {};
  const remove = jest.fn();
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockReturnValue(
    new Promise((done) => {
      resolve = done;
    }),
  );
  jest.spyOn(AccessibilityInfo, 'addEventListener').mockImplementation((_event, handler) => {
    listener = handler;
    return { remove };
  });
  function Probe() {
    return <Text>{String(useReducedMotion())}</Text>;
  }
  const ui = await render(<Probe />);
  expect(ui.getByText('true')).toBeTruthy();
  await act(async () => {
    listener(false);
    resolve(true);
  });
  expect(ui.getByText('false')).toBeTruthy();
  await act(async () => {
    listener(true);
  });
  expect(ui.getByText('true')).toBeTruthy();
  await ui.unmount();
  expect(remove).toHaveBeenCalledTimes(1);
});
