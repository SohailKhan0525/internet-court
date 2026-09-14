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

const RENDER_TIMEOUT_MS = 10000;

export default function Turnstile({ onToken, onError }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  const clearRenderTimeout = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const renderWidget = useCallback(() => {
    if (!siteKey || !containerRef.current || !window.turnstile || widgetId.current !== null) return;
    clearRenderTimeout();
    widgetId.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      // 'always' keeps the widget visibly present (a checkbox, not a silent
      // background check) so users always have feedback and a real element
      // to interact with — 'interaction-only' can render completely invisible
      // and give no sign anything happened if it fails.
      appearance: 'always',
      theme: 'light',
      callback: onToken,
      'expired-callback': () => onToken(''),
      'error-callback': () => {
        onToken('');
        onError?.();
      },
    });
  }, [siteKey, onToken, onError, clearRenderTimeout]);

  useEffect(() => {
    if (!siteKey) {
      onError?.();
      return;
    }
    // If the Cloudflare script never loads (network issue, blocked, slow
    // connection) the widget would otherwise sit blank forever with no
    // feedback. Fail loudly instead after a reasonable wait.
    timeoutRef.current = window.setTimeout(() => {
      if (widgetId.current === null) onError?.();
    }, RENDER_TIMEOUT_MS);
    renderWidget();
    return () => {
      clearRenderTimeout();
      if (widgetId.current !== null) window.turnstile?.reset(widgetId.current);
      widgetId.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!siteKey) return null;

  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" onLoad={renderWidget} />
      <div ref={containerRef} aria-label="Security verification" />
    </>
  );
}
