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
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={manrope.variable}>
        <a className="skip-link" href="#main">Skip to content</a>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
