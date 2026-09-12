'use client';

import Script from 'next/script';
import { useEffect, useRef } from 'react';

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
  const widgetId = useRef<string>();
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!siteKey || !containerRef.current || !window.turnstile) return;
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

    return () => {
      if (widgetId.current) window.turnstile?.reset(widgetId.current);
      widgetId.current = undefined;
    };
  }, [siteKey, onToken, onError]);

  if (!siteKey) return null;

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
        onLoad={() => {
          if (!containerRef.current || !window.turnstile || widgetId.current) return;
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
        }}
      />
      <div ref={containerRef} aria-label="Security verification" />
    </>
  );
}
