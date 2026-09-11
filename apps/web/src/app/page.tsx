import type { Metadata } from 'next';
import { SiteHeader } from '@/components/site-header';
import { Separator } from '@/components/ui/separator';
import {
  HeroSection,
  MeasuresSection,
  HowItWorksSection,
  PricingSection,
  CodeExampleSection,
  DifferentiatorsSection,
  SiteFooter,
} from '@/components/landing';

export const metadata: Metadata = {
  title: 'Startup Validation for AI Agents & Developers',
  description:
    'Validex scores any startup domain across security, trust, engineering, and product signals. Deterministic, evidence-backed reports. Pay per call via x402 on Algorand.',
  openGraph: {
    type: 'website',
    siteName: 'Validex',
    title: 'Validex — Startup Validation for AI Agents & Developers',
    description:
      'Validex scores any startup domain across security, trust, engineering, and product signals. Deterministic, evidence-backed reports. Pay per call via x402 on Algorand.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        type: 'image/png',
        alt: 'Validex — startup validation for AI agents and developers',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Validex — Startup Validation for AI Agents & Developers',
    description:
      'Validex scores any startup domain across security, trust, engineering, and product signals. Deterministic, evidence-backed reports. Pay per call via x402 on Algorand.',
    images: ['/og-image.png'],
  },
};



export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <HeroSection />
        <Separator />
        <MeasuresSection />
        <Separator />
        <HowItWorksSection />
        <Separator />
        <PricingSection />
        <Separator />
        <CodeExampleSection />
        <Separator />
        <DifferentiatorsSection />
      </main>

      <SiteFooter />
    </div>
  );
}
