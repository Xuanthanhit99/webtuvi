'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { usePathname } from 'next/navigation';

const GOOGLE_ADS_TAG_ID = 'AW-18479493951';
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const CONSENT_KEY = 'menhvi_google_consent_v1';

type ConsentChoice = 'granted' | 'denied';

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function updateConsent(choice: ConsentChoice) {
  window.gtag?.('consent', 'update', {
    analytics_storage: choice,
    ad_storage: choice,
    ad_user_data: choice,
    ad_personalization: choice,
  });
}

export function GoogleMeasurement() {
  const pathname = usePathname();
  const [consent, setConsent] = useState<ConsentChoice | null>(() => {
    if (typeof window === 'undefined') return null;
    const saved = window.localStorage.getItem(CONSENT_KEY);
    return saved === 'granted' || saved === 'denied' ? saved : null;
  });

  useEffect(() => {
    if (consent) updateConsent(consent);
  }, [consent]);

  useEffect(() => {
    if (!GA_MEASUREMENT_ID || consent !== 'granted' || !window.gtag) return;
    window.gtag('event', 'page_view', {
      page_location: `${window.location.origin}${pathname}`,
      page_path: pathname,
      page_title: document.title,
    });
  }, [pathname, consent]);

  const chooseConsent = (choice: ConsentChoice) => {
    window.localStorage.setItem(CONSENT_KEY, choice);
    setConsent(choice);
  };

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID || GOOGLE_ADS_TAG_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-measurement-config" strategy="afterInteractive">
        {`gtag('js', new Date());
gtag('config', '${GOOGLE_ADS_TAG_ID}');
${GA_MEASUREMENT_ID ? `gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: false });` : ''}`}
      </Script>

      {consent === null ? (
        <aside
          aria-label="Quyền riêng tư và đo lường"
          className="fixed bottom-4 left-4 right-4 z-[100] mx-auto max-w-xl rounded-2xl border border-white/15 bg-[#10231f]/95 p-4 text-sm text-white shadow-2xl backdrop-blur md:left-auto md:right-6 md:max-w-md"
        >
          <p className="leading-6 text-white/90">
            Mệnh Vi dùng Google Analytics và Google Ads để đo lường lượt truy cập và cải thiện trải nghiệm. Bạn có thể đồng ý hoặc từ chối cookie đo lường.
          </p>
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => chooseConsent('denied')}
              className="rounded-lg border border-white/20 px-3 py-2 font-medium text-white/90"
            >
              Từ chối
            </button>
            <button
              type="button"
              onClick={() => chooseConsent('granted')}
              className="rounded-lg bg-white px-3 py-2 font-semibold text-[#10231f]"
            >
              Đồng ý
            </button>
          </div>
        </aside>
      ) : null}
    </>
  );
}
