'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BookOpen, GitFork, Menu, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { WalletConnect } from '@/components/wallet-connect';
import { ThemeToggle } from '@/components/theme-toggle';

const NAV_LINKS = [
  { href: '/app', label: 'Validate', icon: Zap },
  { href: '/docs', label: 'Docs', icon: BookOpen },
];
const GITHUB_URL = 'https://github.com/devfreeguy/validex';

export function SiteHeader() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto grid h-16 w-full max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 sm:gap-3 sm:px-6">
        {/* Navigation list */}
        <div className="flex min-w-0 items-center gap-2 justify-self-start sm:gap-3">
          <nav className="hidden items-center gap-0.5 rounded-full border border-border bg-card p-1 shadow-sm md:flex">
            {NAV_LINKS.map((link) => (
              <Button
                key={link.href}
                asChild
                variant="ghost"
                size="sm"
                className="gap-1.5 rounded-full text-muted-foreground hover:text-foreground"
              >
                <Link href={link.href}>
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              </Button>
            ))}
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="gap-1.5 rounded-full text-muted-foreground hover:text-foreground"
            >
              <a href={GITHUB_URL} target="_blank" rel="noreferrer">
                <GitFork className="h-4 w-4" />
                GitHub
              </a>
            </Button>
          </nav>

          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden" aria-label="Open menu">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Image src="/logo.png" alt="" width={20} height={20} className="h-5 w-5" />
                  Validex
                </SheetTitle>
              </SheetHeader>
              <nav className="mt-6 flex flex-col gap-1">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileNavOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                  >
                    <link.icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                ))}
                <a
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setMobileNavOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                >
                  <GitFork className="h-4 w-4" />
                  GitHub
                </a>
                <ThemeToggle variant="menu-item" />
              </nav>
            </SheetContent>
          </Sheet>

          {/* Mobile-only brand mark, next to the hamburger - the centered
              brand link below takes over at md: so there's one logo per
              breakpoint, not two. Icon-only below sm: a hamburger + full
              wordmark + wallet chip is already tight on a narrow phone;
              the wordmark returns once there's room for it. */}
          <Link href="/" className="flex shrink-0 items-center gap-2 md:hidden">
            <Image src="/logo.png" alt="Validex" width={24} height={24} className="h-6 w-6 shrink-0" priority />
            <span className="hidden text-base font-semibold tracking-tight sm:inline">Validex</span>
          </Link>
        </div>

        {/* Brand (desktop) */}
        <Link href="/" className="hidden items-center gap-2 justify-self-center md:flex">
          <Image src="/logo.png" alt="Validex" width={24} height={24} className="h-6 w-6" priority />
          <span className="text-base font-semibold tracking-tight">Validex</span>
        </Link>

        {/* Action buttons */}
        <div className="flex min-w-0 items-center gap-2 justify-self-end">
          <ThemeToggle className="hidden sm:inline-flex" />
          <WalletConnect />
        </div>
      </div>
    </header>
  );
}
