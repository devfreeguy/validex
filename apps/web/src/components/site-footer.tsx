import Image from 'next/image';

export function SiteFooter() {
  return (
    <footer className="border-t border-border py-6 text-xs text-muted-foreground">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 sm:flex-row sm:px-6">
        <div className="flex items-center gap-2">
          <Image
            src="/algorand.svg"
            alt="Algorand"
            width={16}
            height={16}
            className="h-4 w-4 shrink-0"
          />
          <span>Built for the x402 Global Challenge</span>
        </div>
        <p>© {new Date().getFullYear()} Validex. All rights reserved.</p>
      </div>
    </footer>
  );
}
