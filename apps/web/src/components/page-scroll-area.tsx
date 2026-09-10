'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PageScrollAreaProps {
  children: React.ReactNode;
}

export function PageScrollArea({ children }: PageScrollAreaProps) {
  const pathname = usePathname();
  const viewportRef = React.useRef<HTMLDivElement>(null);

  // Scroll to top on route changes, preserving expected page navigation behavior
  React.useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTop = 0;
    }
  }, [pathname]);

  return (
    <ScrollArea
      viewportRef={viewportRef}
      type="auto"
      className="h-dvh w-full"
    >
      {children}
    </ScrollArea>
  );
}
