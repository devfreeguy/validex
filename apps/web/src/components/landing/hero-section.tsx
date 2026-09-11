import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import HeroImageBG from "@assets/images/hero.jpg"

export function HeroSection() {
  return (
    <section className="relative flex h-dvh w-full flex-col items-center justify-center overflow-hidden px-4 text-center sm:px-6">
      {/* Full-screen Background Image */}
      <div className="pointer-events-none absolute inset-0 select-none overflow-hidden">
        <Image
          src={HeroImageBG}
          alt="Validex night landscape background"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
      </div>

      <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-medium text-white/90 backdrop-blur-md shadow-sm">
          <Image
            src="/algorand.svg"
            alt="Algorand"
            width={16}
            height={16}
            className="h-4 w-4 shrink-0"
          />
          <span>Built for the x402 Global Challenge</span>
        </div>

        <h1 className="text-4xl font-semibold tracking-tight text-balance text-white drop-shadow-md sm:text-5xl lg:text-6xl">
          Startup validation, callable by anyone or anything.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-balance text-base font-normal text-white/90 drop-shadow sm:text-lg">
          Deterministic, evidence-backed reports on security, trust,
          engineering, and product signals. Paid per call in USDC via x402.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button
            asChild
            size="lg"
            className="border-none bg-white text-neutral-900 shadow-lg hover:bg-neutral-100 hover:text-neutral-950 font-medium"
          >
            <Link href="/app">
              Run a check
              <ArrowRight className="h-4 w-4 text-neutral-900" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"
          >
            <Link href="/docs">Read the docs</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
