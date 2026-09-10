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
  title: 'Validex - Startup health validation for AI agents',
  description:
    'Pay-per-call startup validation API. Deterministic, evidence-backed reports on security, trust, engineering, and product signals. Settled on Algorand via x402.',
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
