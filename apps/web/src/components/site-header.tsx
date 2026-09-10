'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { href: '/app', label: 'Validate', icon: Zap },
  { href: '/docs', label: 'Docs', icon: BookOpen },
];
const GITHUB_URL = 'https://github.com/devfreeguy/validex';

interface SiteHeaderProps {
  className?: string;
  transparentOnTop?: boolean;
}

export function SiteHeader({ className, transparentOnTop }: SiteHeaderProps = {}) {
  const pathname = usePathname();
  const isLandingPage = transparentOnTop ?? pathname === '/';

  const [scrolledPastHero, setScrolledPastHero] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!isLandingPage) {
      return;
    }

    const getViewport = () =>
      document.querySelector<HTMLElement>('[data-radix-scroll-area-viewport]') ||
      window;

    const handleScroll = () => {
      const viewport = document.querySelector<HTMLElement>(
        '[data-radix-scroll-area-viewport]',
      );
      const scrollY = viewport
        ? viewport.scrollTop
        : window.scrollY || document.documentElement.scrollTop || 0;
      // The hero is full-viewport (100dvh). Header height is 64px.
      // Once scrolled past the hero section:
      const heroThreshold = (window.innerHeight || 800) - 64;
      setScrolledPastHero(scrollY >= heroThreshold);
    };

    handleScroll();
    const scrollTarget = getViewport();
    scrollTarget.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    return () => {
      scrollTarget.removeEventListener('scroll', handleScroll);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [isLandingPage]);

  // Non-landing pages: always standard header styling without hero scroll adaptation
  if (!isLandingPage) {
    return (
      <header
        className={cn(
          'sticky top-0 z-40 w-full border-b border-border/70 bg-background/85 backdrop-blur supports-backdrop-filter:bg-background/70',
          className,
        )}
      >
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

  // Landing page: adapts colors over dark hero, switches to normal theme past hero
  const isOverHero = !scrolledPastHero;

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 ease-in-out',
        isOverHero
          ? 'border-b border-transparent bg-transparent shadow-none backdrop-blur-none'
          : 'border-b border-border/70 bg-background/85 backdrop-blur-md supports-backdrop-filter:bg-background/70 shadow-sm',
        className,
      )}
    >
      <div className="mx-auto grid h-16 w-full max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 sm:gap-3 sm:px-6">
        {/* Navigation list */}
        <div className="flex min-w-0 items-center gap-2 justify-self-start sm:gap-3">
          <nav
            className={cn(
              'hidden items-center gap-0.5 rounded-full p-1 transition-all duration-300 md:flex',
              isOverHero
                ? 'border border-white/20 bg-white/10 backdrop-blur-md shadow-sm'
                : 'border border-border bg-card/90 shadow-sm',
            )}
          >
            {NAV_LINKS.map((link) => (
              <Button
                key={link.href}
                asChild
                variant="ghost"
                size="sm"
                className={cn(
                  'gap-1.5 rounded-full transition-colors',
                  isOverHero
                    ? 'text-white/90 hover:text-white hover:bg-white/15'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/40',
                )}
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
              className={cn(
                'gap-1.5 rounded-full transition-colors',
                isOverHero
                  ? 'text-white/90 hover:text-white hover:bg-white/15'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/40',
              )}
            >
              <a href={GITHUB_URL} target="_blank" rel="noreferrer">
                <GitFork className="h-4 w-4" />
                GitHub
              </a>
            </Button>
          </nav>

          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'md:hidden transition-colors',
                  isOverHero
                    ? 'text-white hover:bg-white/15'
                    : 'text-foreground hover:bg-accent',
                )}
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
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

          {/* Mobile-only brand mark */}
          <Link href="/" className="flex shrink-0 items-center gap-2 md:hidden">
            <Image src="/logo.png" alt="Validex" width={24} height={24} className="h-6 w-6 shrink-0" priority />
            <span
              className={cn(
                'hidden text-base font-semibold tracking-tight sm:inline transition-colors',
                isOverHero ? 'text-white' : 'text-foreground',
              )}
            >
              Validex
            </span>
          </Link>
        </div>

        {/* Brand (desktop) */}
        <Link href="/" className="hidden items-center gap-2 justify-self-center md:flex">
          <Image src="/logo.png" alt="Validex" width={24} height={24} className="h-6 w-6" priority />
          <span
            className={cn(
              'text-base font-semibold tracking-tight transition-colors',
              isOverHero ? 'text-white' : 'text-foreground',
            )}
          >
            Validex
          </span>
        </Link>

        {/* Action buttons */}
        <div className="flex min-w-0 items-center gap-2 justify-self-end">
          <ThemeToggle
            className={cn(
              'hidden sm:inline-flex transition-colors',
              isOverHero && 'border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm',
            )}
          />
          <WalletConnect
            className={cn(
              'transition-colors',
              isOverHero && 'border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm',
            )}
          />
        </div>
      </div>
    </header>
  );
}
