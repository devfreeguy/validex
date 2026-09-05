'use client';

import { WalletProvider } from '@txnlab/use-wallet-react';
import { walletManager } from '@/lib/wallet-manager';

export function Providers({ children }: { children: React.ReactNode }) {
  return <WalletProvider manager={walletManager}>{children}</WalletProvider>;
}
