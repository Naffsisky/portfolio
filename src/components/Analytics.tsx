'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';
import Clarity from '@microsoft/clarity';

const GA_ID = 'G-FPPJBDCL8D';
const CLARITY_ID = 'sxm04v3j0c';
const HOTJAR_ID = 6495774;
const HOTJAR_SV = 6;

export default function Analytics() {
  const pathname = usePathname();

  // Init sekali di client
  useEffect(() => {
    try { Clarity.init(CLARITY_ID); } catch {}
  }, []);

  // Pageview di setiap pergantian route
  useEffect(() => {
    const qs = typeof window !== 'undefined' ? window.location.search : '';
    const url = `${pathname}${qs || ''}`;
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('config', GA_ID, { page_path: url });
    }
  }, [pathname]);

  return (
    <>
      {/* GA */}
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="ga" strategy="afterInteractive">{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date()); gtag('config', '${GA_ID}');
      `}</Script>

      {/* Hotjar */}
      <Script id="hotjar" strategy="afterInteractive">{`
        (function(h,o,t,j,a,r){
          h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
          h._hjSettings={hjid:${HOTJAR_ID},hjsv:${HOTJAR_SV}};
          a=o.getElementsByTagName('head')[0];
          r=o.createElement('script');r.async=1;
          r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
          a.appendChild(r);
        })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
      `}</Script>
    </>
  );
}
