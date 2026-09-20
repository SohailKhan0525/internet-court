import type { Metadata, Viewport } from 'next';
import { Fraunces, Inter, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';
import { ToastProvider } from './components/Toast';
import RealtimeNotices from './components/RealtimeNotices';

const fraunces = Fraunces({ subsets: ['latin'], display: 'swap', variable: '--font-fraunces', weight: ['500', '600', '700'] });
const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' });
const plexMono = IBM_Plex_Mono({ subsets: ['latin'], display: 'swap', variable: '--font-plex-mono', weight: ['400', '600'] });
const siteUrl = 'https://loopproof.me';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Internet Court | Someone is wrong. Probably you.',
  description: 'Put your argument on trial. Let strangers vote. Get a verdict worth sending to the group chat.',
  alternates: { canonical: siteUrl },
  openGraph: {
    title: 'Internet Court | Someone is wrong. Probably you.',
    description: 'Put your argument on trial. Let strangers vote. Get a verdict worth sending to the group chat.',
    url: siteUrl,
    siteName: 'Internet Court',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@qofeno',
    creator: '@qofeno',
    title: 'Internet Court | Someone is wrong. Probably you.',
    description: 'Put your argument on trial. Let strangers vote. Get a verdict worth sending to the group chat.',
  },
  verification: {
    google: 'SU6MEJx7U1dYCNjzH8u61_7BQd8Jbj3YhSBwU6Fj0gw',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Internet Court',
    url: siteUrl,
    description: 'A public court where people submit a case, strangers vote, and the case receives a real verdict.',
    sameAs: ['https://x.com/qofeno'],
  };
  return (
    <html lang="en">
      <body className={`${fraunces.variable} ${inter.variable} ${plexMono.variable}`}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
        <a className="skip-link" href="#main">Skip to content</a>
        <ToastProvider>
          <RealtimeNotices />
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
