import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import { cn } from '@/lib/utils';
import './globals.css';
import { Providers } from './providers';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

const APP_TITLE = 'Validex';
const APP_DESCRIPTION =
  'Validate any startup in seconds. Validex runs security, trust, engineering, and product checks on any company domain and returns a deterministic score, letter grade, and evidence-backed report. Pay per analysis via x402 on Algorand.';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: APP_TITLE,
    template: `%s · ${APP_TITLE}`,
  },
  description: APP_DESCRIPTION,
  openGraph: {
    type: 'website',
    siteName: APP_TITLE,
    title: APP_TITLE,
    description: APP_DESCRIPTION,
    url: APP_URL,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        type: 'image/png',
        alt: 'Validex — startup validation for AI agents and developers',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: APP_TITLE,
    description: APP_DESCRIPTION,
    images: ['/og-image.png'],
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning is required here by next-themes: it sets the
    // class attribute on <html> before hydration via its own injected
    // script, which otherwise mismatches React's server-rendered markup.
    <html lang="en" suppressHydrationWarning>
      <body className={cn(outfit.variable, 'bg-background font-sans text-foreground antialiased')}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
