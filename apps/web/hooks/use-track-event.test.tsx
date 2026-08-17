import { render } from '@testing-library/react';
import { useTrackEvent } from './use-track-event';
import { trackEvent } from '@/lib/analytics';

jest.mock('@/lib/analytics', () => ({ trackEvent: jest.fn() }));

function TestComponent({ properties }: { properties?: { feature: 'dashboard' } }) {
  useTrackEvent('dashboard_viewed', properties);
  return null;
}

describe('useTrackEvent', () => {
  beforeEach(() => {
    (trackEvent as jest.Mock).mockClear();
  });

  it('fires the event exactly once on mount', () => {
    render(<TestComponent properties={{ feature: 'dashboard' }} />);
    expect(trackEvent).toHaveBeenCalledTimes(1);
    expect(trackEvent).toHaveBeenCalledWith('dashboard_viewed', { feature: 'dashboard' });
  });

  it('does not re-fire on a re-render with a new properties object identity', () => {
    const { rerender } = render(<TestComponent properties={{ feature: 'dashboard' }} />);
    expect(trackEvent).toHaveBeenCalledTimes(1);
    rerender(<TestComponent properties={{ feature: 'dashboard' }} />);
    expect(trackEvent).toHaveBeenCalledTimes(1);
  });
});
