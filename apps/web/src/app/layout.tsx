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

export const metadata: Metadata = {
  title: 'Validex - Startup health validation for AI agents',
  description:
    'Pay-per-call startup validation API. One request, a deterministic score, evidence-backed. Settled on Algorand via x402.',
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
