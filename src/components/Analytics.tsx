'use client';

import Script from 'next/script';
import { useEffect } from 'react';
import Clarity from '@microsoft/clarity';

const CLARITY_ID = 'sxm04v3j0c';
const HOTJAR_ID = 6495774;
const HOTJAR_SV = 6;

function shouldLoadTracking() {
  if (typeof navigator === 'undefined') return true;
  const gpc = (navigator as any).globalPrivacyControl === true;
  const dnt =
    (navigator as any).doNotTrack === '1' ||
    (window as any).doNotTrack === '1' ||
    (navigator as any).msDoNotTrack === '1';
  return !(gpc || dnt);
}

export default function Analytics() {
  useEffect(() => {
    if (typeof window !== 'undefined' && !(window as any).__CLARITY_ONCE__) {
      try { Clarity.init(CLARITY_ID); } catch {}
      (window as any).__CLARITY_ONCE__ = true;
    }
  }, []);

  if (!shouldLoadTracking()) return null;

  return (
    <>
      <Script
        id="hotjar-src"
        strategy="afterInteractive"
        src={`https://static.hotjar.com/c/hotjar-${HOTJAR_ID}.js?sv=${HOTJAR_SV}`}
        onError={() => console.debug('Hotjar diblokir oleh client')}
      />

      <Script
        id="clarity-src"
        strategy="afterInteractive"
        src={`https://www.clarity.ms/tag/${CLARITY_ID}`}
        onError={() => console.debug('Clarity diblokir oleh client')}
      />
    </>
  );
}
