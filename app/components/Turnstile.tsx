'use client';

import Script from 'next/script';
import { useCallback, useEffect, useRef } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: {
        sitekey: string;
        callback: (token: string) => void;
        'expired-callback'?: () => void;
        'error-callback'?: () => void;
        appearance?: 'always' | 'execute' | 'interaction-only';
        theme?: 'auto' | 'light' | 'dark';
      }) => string;
      reset: (widgetId?: string) => void;
    };
  }
}

type TurnstileProps = {
  onToken: (token: string) => void;
  onError?: () => void;
};

export default function Turnstile({ onToken, onError }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  const renderWidget = useCallback(() => {
    if (!siteKey || !containerRef.current || !window.turnstile || widgetId.current !== null) return;
    widgetId.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      appearance: 'interaction-only',
      theme: 'auto',
      callback: onToken,
      'expired-callback': () => onToken(''),
      'error-callback': () => {
        onToken('');
        onError?.();
      },
    });
  }, [siteKey, onToken, onError]);

  useEffect(() => {
    renderWidget();

    return () => {
      if (widgetId.current !== null) window.turnstile?.reset(widgetId.current);
      widgetId.current = null;
    };
  }, [renderWidget]);

  if (!siteKey) return null;

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
        onLoad={renderWidget}
      />
      <div ref={containerRef} aria-label="Security verification" />
    </>
  );
}
