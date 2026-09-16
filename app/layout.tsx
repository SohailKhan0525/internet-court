import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import './globals.css';
import { ToastProvider } from './components/Toast';

const manrope = Manrope({ subsets: ['latin'], display: 'swap', variable: '--font-manrope' });
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
    title: 'Internet Court | Someone is wrong. Probably you.',
    description: 'Put your argument on trial. Let strangers vote. Get a verdict worth sending to the group chat.',
  },
  verification: {
    google: 'SU6MEJx7U1dYCNjzH8u61_7BQd8Jbj3YhSBwU6Fj0gw',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Internet Court',
    url: siteUrl,
    description: 'A public court where people submit a case, strangers vote, and the case receives a real verdict.',
  };
  return (
    <html lang="en">
      <body className={manrope.variable}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
        <a className="skip-link" href="#main">Skip to content</a>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
