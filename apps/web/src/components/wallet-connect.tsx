'use client';

import { useState } from 'react';
import { useWallet } from '@txnlab/use-wallet-react';
import { Check, Copy, Loader2, LogOut, ShieldCheck, Wallet } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import { network } from '@/lib/wallet-manager';

function truncate(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

interface WalletConnectProps {
  className?: string;
}

export function WalletConnect({ className }: WalletConnectProps = {}) {
  const { wallets, activeWallet, activeAddress, isReady } = useWallet();
  const [connecting, setConnecting] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          <Button variant="secondary" className={cn("gap-2", className)}>
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-success" />
            {truncate(activeAddress)}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {activeWallet.metadata.icon ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={activeWallet.metadata.icon}
                  alt={activeWallet.metadata.name}
                  className="h-4 w-4 rounded-sm object-contain"
                />
              ) : null}
              <span>{activeWallet.metadata.name}</span>
            </div>
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
            className="text-destructive focus:text-destructive cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu onOpenChange={() => setError(null)}>
      <DropdownMenuTrigger asChild>
        <Button className={cn("gap-2", className)}>
          <Wallet className="h-4 w-4" />
          Connect wallet
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="flex items-center justify-between gap-2 text-xs font-normal text-muted-foreground">
          <span>Choose an Algorand wallet</span>
          <Badge variant="muted" className="capitalize text-[10px]">
            {network}
          </Badge>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {wallets.map((wallet) => (
          <DropdownMenuItem
            key={wallet.id}
            disabled={connecting !== null}
            onSelect={async (e) => {
              e.preventDefault();
              setConnecting(wallet.id);
              setError(null);
              try {
                const accounts = await wallet.connect();
                if (accounts && accounts.length > 0) {
                  wallet.setActive();
                }
              } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : 'Failed to connect wallet';
                if (
                  !msg.toLowerCase().includes('user rejected') &&
                  !msg.toLowerCase().includes('cancelled') &&
                  !msg.toLowerCase().includes('closed')
                ) {
                  setError(msg);
                }
              } finally {
                setConnecting(null);
              }
            }}
            className="flex items-center justify-between py-2 cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              {wallet.metadata.icon ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={wallet.metadata.icon}
                  alt={wallet.metadata.name}
                  className="h-4 w-4 rounded-sm object-contain"
                />
              ) : (
                <Wallet className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="font-medium text-sm">{wallet.metadata.name}</span>
            </div>
            {connecting === wallet.id ? (
              <Loader2 className="ml-auto h-4 w-4 animate-spin text-muted-foreground" />
            ) : null}
          </DropdownMenuItem>
        ))}
        {error ? (
          <div className="mx-2 my-1 px-2.5 py-1.5 text-xs text-destructive bg-destructive/10 rounded-md">
            {error}
          </div>
        ) : null}
        <DropdownMenuSeparator />
        <div className="flex items-center gap-2 px-2.5 py-2 text-[11px] leading-tight text-muted-foreground bg-muted/30 rounded-b-sm">
          <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
          <span>Private keys & seed phrases are never shared with Validex.</span>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
