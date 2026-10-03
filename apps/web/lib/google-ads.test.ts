import { trackNatalChartGoogleAdsConversion } from './google-ads';

describe('trackNatalChartGoogleAdsConversion', () => {
  afterEach(() => {
    delete window.gtag;
  });

  it('sends the configured Google Ads conversion event', () => {
    const gtag = jest.fn();
    window.gtag = gtag;

    trackNatalChartGoogleAdsConversion();

    expect(gtag).toHaveBeenCalledTimes(1);
    expect(gtag).toHaveBeenCalledWith('event', 'conversion', {
      send_to: 'AW-18479493951/jG-pCLitsokdEL_m2utE',
    });
  });

  it('is a no-op when the Google tag is unavailable', () => {
    expect(() => trackNatalChartGoogleAdsConversion()).not.toThrow();
  });

  it('never breaks the product flow when the Google tag throws', () => {
    window.gtag = jest.fn(() => {
      throw new Error('blocked');
    });

    expect(() => trackNatalChartGoogleAdsConversion()).not.toThrow();
  });
});
