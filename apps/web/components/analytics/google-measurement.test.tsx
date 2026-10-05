import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { GoogleMeasurement } from './google-measurement';

jest.mock('next/navigation', () => ({
  usePathname: () => '/tarot',
}));

jest.mock('next/script', () => {
  return function MockScript(props: { id?: string; src?: string; children?: React.ReactNode }) {
    return (
      <div data-testid={props.id || 'external-google-tag'} data-src={props.src}>
        {typeof props.children === 'string' ? props.children : null}
      </div>
    );
  };
});

describe('GoogleMeasurement', () => {
  const originalGaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = 'G-TEST123456';
    window.localStorage.clear();
    window.dataLayer = [];
    window.gtag = jest.fn();
  });

  afterEach(() => {
    delete window.gtag;
    if (originalGaMeasurementId === undefined) {
      delete process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
    } else {
      process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = originalGaMeasurementId;
    }
  });

  it('uses a single Google tag loader and keeps the existing Ads destination', () => {
    render(<GoogleMeasurement />);

    const config = screen.getByTestId('google-measurement-config');
    const loaders = screen.getAllByTestId('external-google-tag');

    expect(config.textContent).toContain("AW-18479493951");
    expect(config.textContent).toContain("G-TEST123456");
    expect(loaders).toHaveLength(1);
  });

  it('does not send a page view until analytics consent is granted', async () => {
    render(<GoogleMeasurement />);

    expect(window.gtag).not.toHaveBeenCalledWith('event', 'page_view', expect.anything());

    fireEvent.click(screen.getByRole('button', { name: 'Đồng ý' }));

    await waitFor(() => {
      expect(window.gtag).toHaveBeenCalledWith(
        'consent',
        'update',
        expect.objectContaining({ analytics_storage: 'granted' }),
      );
      expect(window.gtag).toHaveBeenCalledWith(
        'event',
        'page_view',
        expect.objectContaining({ page_path: '/tarot' }),
      );
      expect(
        (window.gtag as jest.Mock).mock.calls.filter(
          ([command, eventName]) => command === 'event' && eventName === 'page_view',
        ),
      ).toHaveLength(1);
    });
  });

  it('persists denial and does not send a page view', async () => {
    render(<GoogleMeasurement />);
    fireEvent.click(screen.getByRole('button', { name: 'Từ chối' }));

    await waitFor(() => {
      expect(window.localStorage.getItem('menhvi_google_consent_v1')).toBe('denied');
    });
    expect(window.gtag).not.toHaveBeenCalledWith('event', 'page_view', expect.anything());
  });
});
