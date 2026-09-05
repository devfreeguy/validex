'use client';

import { useState } from 'react';
import { useWallet } from '@txnlab/use-wallet-react';

function truncate(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function WalletConnect() {
  const { wallets, activeWallet, activeAddress } = useWallet();
  const [open, setOpen] = useState(false);
  const [connecting, setConnecting] = useState<string | null>(null);

  if (activeWallet && activeAddress) {
    return (
      <div className="flex items-center gap-3">
        <span className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-neutral-300">
          {activeWallet.metadata.name} · {truncate(activeAddress)}
        </span>
        <button
          onClick={() => void activeWallet.disconnect()}
          className="text-xs text-neutral-500 transition hover:text-neutral-300"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-full bg-emerald-400 px-4 py-1.5 text-xs font-medium text-neutral-950 transition hover:bg-emerald-300"
      >
        Connect wallet
      </button>
      {open ? (
        <div className="absolute right-0 z-10 mt-2 w-56 rounded-xl border border-white/10 bg-neutral-900 p-2 shadow-xl">
          {wallets.map((wallet) => (
            <button
              key={wallet.id}
              disabled={connecting !== null}
              onClick={async () => {
                setConnecting(wallet.id);
                try {
                  await wallet.connect();
                  wallet.setActive();
                  setOpen(false);
                } finally {
                  setConnecting(null);
                }
              }}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-neutral-200 transition hover:bg-white/5 disabled:opacity-50"
            >
              {wallet.metadata.name}
              {connecting === wallet.id ? (
                <span className="text-xs text-neutral-500">connecting…</span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
