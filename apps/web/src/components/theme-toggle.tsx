'use client';

import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  /** "icon" for the compact header button, "menu-item" for a full-width
   * row matching the mobile nav sheet's other links. */
  variant?: 'icon' | 'menu-item';
  className?: string;
}

// Both icon/label variants render on server and client alike - only
// Tailwind's `dark:` variant (driven by the `dark` class next-themes
// applies before hydration) decides which is visible. No client-only state
// is needed to pick the "right" one, so there's no mount flag and no
// hydration mismatch to guard against.
function ThemeIcon() {
  return (
    <>
      <Sun className="hidden h-4 w-4 dark:block" />
      <Moon className="h-4 w-4 dark:hidden" />
    </>
  );
}

export function ThemeToggle({ variant = 'icon', className }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();

  function toggle() {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  }

  if (variant === 'menu-item') {
    return (
      <button
        type="button"
        onClick={toggle}
        className={cn(
          'flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-accent',
          className,
        )}
      >
        <ThemeIcon />
        <span className="dark:hidden">Dark mode</span>
        <span className="hidden dark:inline">Light mode</span>
      </button>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={toggle}
      aria-label="Toggle theme"
      title="Toggle theme"
      className={className}
    >
      <ThemeIcon />
    </Button>
  );
}
