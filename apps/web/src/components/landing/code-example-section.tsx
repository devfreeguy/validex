const API_URL = 'https://api.validex.dev';

export const SECURITY_EXAMPLE = `curl -X POST ${API_URL}/v1/validate/security \\
  -H "Content-Type: application/json" \\
  -H "PAYMENT-SIGNATURE: <payment-token>" \\
  -d '{"target": "stripe.com"}'`;

export const COMPARE_EXAMPLE = `curl -X POST ${API_URL}/v1/validate/compare \\
  -H "Content-Type: application/json" \\
  -H "PAYMENT-SIGNATURE: <payment-token>" \\
  -d '{"targets": ["stripe.com", "github.com"]}'`;

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-xl border border-border bg-secondary p-5 text-xs leading-relaxed text-foreground sm:text-sm">
      <code>{children}</code>
    </pre>
  );
}

export function CodeExampleSection() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-20">
      <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        Call it directly
      </h2>

      <div className="mt-8 space-y-6">
        <div>
          <p className="mb-2 text-sm font-medium text-muted-foreground">
            Single category check
          </p>
          <CodeBlock>{SECURITY_EXAMPLE}</CodeBlock>
        </div>
        <div>
          <p className="mb-2 text-sm font-medium text-muted-foreground">
            Compare multiple companies
          </p>
          <CodeBlock>{COMPARE_EXAMPLE}</CodeBlock>
        </div>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        AI agents can automate payment with{' '}
        <code className="text-foreground">@x402/axios</code> or{' '}
        <code className="text-foreground">@x402/fetch</code>.
      </p>
    </section>
  );
}
