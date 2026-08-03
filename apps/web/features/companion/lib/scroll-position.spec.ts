import { isNearBottom, NEAR_BOTTOM_THRESHOLD_PX } from './scroll-position';

describe('isNearBottom', () => {
  it('is true when scrolled all the way to the bottom', () => {
    expect(isNearBottom({ scrollTop: 800, scrollHeight: 1000, clientHeight: 200 })).toBe(true);
  });

  it('is true when within the threshold of the bottom', () => {
    expect(isNearBottom({ scrollTop: 700, scrollHeight: 1000, clientHeight: 200 }, 100)).toBe(true);
  });

  it('is false when scrolled well above the bottom (reading older messages)', () => {
    expect(isNearBottom({ scrollTop: 100, scrollHeight: 1000, clientHeight: 200 }, 100)).toBe(false);
  });

  it('uses the default threshold when none is passed', () => {
    const justInside = { scrollTop: 1000 - 200 - (NEAR_BOTTOM_THRESHOLD_PX - 1), scrollHeight: 1000, clientHeight: 200 };
    const justOutside = { scrollTop: 1000 - 200 - (NEAR_BOTTOM_THRESHOLD_PX + 1), scrollHeight: 1000, clientHeight: 200 };
    expect(isNearBottom(justInside)).toBe(true);
    expect(isNearBottom(justOutside)).toBe(false);
  });

  it('treats a container shorter than its viewport (no scrollbar) as near bottom', () => {
    expect(isNearBottom({ scrollTop: 0, scrollHeight: 100, clientHeight: 200 })).toBe(true);
  });
});
