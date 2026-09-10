'use client';

import { useState } from 'react';
import { useWallet } from '@txnlab/use-wallet-react';
import { Check, Copy, Loader2, LogOut, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { network } from '@/lib/wallet-manager';

function truncate(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function WalletConnect() {
  const { wallets, activeWallet, activeAddress, isReady } = useWallet();
  const [connecting, setConnecting] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function copyAddress(address: string) {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access can fail (permissions, insecure context) - not
      // worth surfacing an error for a convenience action.
    }
  }

  // isReady is false on both the server and the client's first paint -
  // the wallet manager restores a persisted session asynchronously after
  // mount, so gating on it (rather than just activeWallet/activeAddress)
  // keeps the first client render identical to the server's, and avoids a
  // hydration mismatch once the real session is restored.
  if (isReady && activeWallet && activeAddress) {
    return (
      <DropdownMenu onOpenChange={() => setCopied(false)}>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="sm" className="gap-2">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-success" />
            {truncate(activeAddress)}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel className="flex items-center justify-between gap-2">
            <span>{activeWallet.metadata.name}</span>
            <Badge variant="muted" className="capitalize">
              {network}
            </Badge>
          </DropdownMenuLabel>
          <button
            type="button"
            onClick={() => void copyAddress(activeAddress)}
            className="flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 font-mono text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            {truncate(activeAddress)}
            {copied ? (
              <Check className="h-3.5 w-3.5 shrink-0 text-success" />
            ) : (
              <Copy className="h-3.5 w-3.5 shrink-0" />
            )}
          </button>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => void activeWallet.disconnect()}
            className="text-destructive focus:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" className="gap-2">
          <Wallet className="h-4 w-4" />
          Connect wallet
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          Choose a wallet ·{' '}
          <span className="capitalize text-foreground">{network}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {wallets.map((wallet) => (
          <DropdownMenuItem
            key={wallet.id}
            disabled={connecting !== null}
            onSelect={async (e) => {
              e.preventDefault();
              setConnecting(wallet.id);
              try {
                await wallet.connect();
                wallet.setActive();
              } finally {
                setConnecting(null);
              }
            }}
          >
            {wallet.metadata.name}
            {connecting === wallet.id ? (
              <Loader2 className="ml-auto h-4 w-4 animate-spin text-muted-foreground" />
            ) : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
