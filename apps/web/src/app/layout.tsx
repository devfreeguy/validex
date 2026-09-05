import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Validex — Startup health validation for AI agents',
  description:
    'Pay-per-call startup validation API. One request, a deterministic score, evidence-backed. Settled on Algorand via x402.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-neutral-950 text-neutral-100 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
