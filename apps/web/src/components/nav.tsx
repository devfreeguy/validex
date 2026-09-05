import Link from 'next/link';
import { WalletConnect } from './wallet-connect';

export function Nav() {
  return (
    <header className="border-b border-white/10">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Validex
        </Link>
        <div className="flex items-center gap-6">
          <nav className="flex items-center gap-6 text-sm text-neutral-400">
            <Link href="/app" className="transition hover:text-neutral-100">
              Try it
            </Link>
            <Link href="/docs" className="transition hover:text-neutral-100">
              Docs
            </Link>
          </nav>
          <WalletConnect />
        </div>
      </div>
    </header>
  );
}
