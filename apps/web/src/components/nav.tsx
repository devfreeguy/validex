import Link from 'next/link';

export function Nav() {
  return (
    <header className="border-b border-white/10">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Validex
        </Link>
        <nav className="flex items-center gap-6 text-sm text-neutral-400">
          <Link href="/docs" className="transition hover:text-neutral-100">
            Docs
          </Link>
          <a
            href="https://x402.org"
            target="_blank"
            rel="noreferrer"
            className="transition hover:text-neutral-100"
          >
            x402
          </a>
        </nav>
      </div>
    </header>
  );
}
