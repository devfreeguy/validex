export const HOW_IT_WORKS = [
  {
    step: '1',
    title: 'Send a request',
    body: 'POST a domain (or 2-5 domains to compare) to the check you need. Pay via x402 in USDC on Algorand - no signup, no API key.',
  },
  {
    step: '2',
    title: 'We run the checks',
    body: 'Deterministic validators query live signals - DNS, TLS, GitHub, and the site itself - for exactly the categories your call covers.',
  },
  {
    step: '3',
    title: 'Get a scored report',
    body: 'A grade, a confidence level, and the evidence behind it, plus strengths and weaknesses. On AI endpoints, a plain-English recommendation: integrate, caution, or avoid.',
  },
];

export function HowItWorksSection() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
      <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        How it works
      </h2>

      <div className="mt-8 grid gap-8 sm:grid-cols-3">
        {HOW_IT_WORKS.map((item) => (
          <div key={item.step}>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
              {item.step}
            </div>
            <h3 className="mt-4 font-semibold">{item.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {item.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
