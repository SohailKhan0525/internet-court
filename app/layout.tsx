import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Internet Court | Someone is wrong. Probably you.',
  description: 'Put your argument on trial. Let strangers vote. Get a verdict worth sending to the group chat.',
  openGraph: {
    title: 'Internet Court | Someone is wrong. Probably you.',
    description: 'Put your argument on trial. Let strangers vote. Get a verdict worth sending to the group chat.',
    type: 'website',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">Skip to content</a>
        {children}
      </body>
    </html>
  );
}
