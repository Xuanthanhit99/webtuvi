const NATAL_CHART_CONVERSION_DESTINATION = 'AW-18479493951/jG-pCLitsokdEL_m2utE';

type Gtag = (command: 'event', eventName: 'conversion', params: { send_to: string }) => void;

declare global {
  interface Window {
    gtag?: Gtag;
  }
}

/**
 * Reports a Google Ads conversion only after the backend has successfully created a new
 * natal chart. This intentionally does not run on page load, result re-fetch, interpretation
 * retry, or historical-chart views.
 *
 * Google Ads is optional telemetry: ad blockers, consent tooling, or a failed tag must never
 * break the chart flow.
 */
export function trackNatalChartGoogleAdsConversion(): void {
  try {
    if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
    window.gtag('event', 'conversion', { send_to: NATAL_CHART_CONVERSION_DESTINATION });
  } catch {
    // Conversion telemetry must never affect the user-facing calculation flow.
  }
}
