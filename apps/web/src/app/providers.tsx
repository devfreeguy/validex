'use client';

import { ThemeProvider } from 'next-themes';
import { WalletProvider } from '@txnlab/use-wallet-react';
import { walletManager } from '@/lib/wallet-manager';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <WalletProvider manager={walletManager}>{children}</WalletProvider>
    </ThemeProvider>
  );
}
