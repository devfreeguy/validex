import { Injectable } from '@nestjs/common';
import * as dns from 'node:dns/promises';
import { Resolver } from 'node:dns/promises';
import type { MxRecord } from 'node:dns';

// Some environments (containers/sandboxes) refuse c-ares' direct queries
// to whatever DNS server is configured in /etc/resolv.conf even though the
// OS-level resolver (getaddrinfo, `nslookup`) works fine against it. A
// fallback resolver pointed at public DNS keeps lookups working there
// without changing behavior anywhere DNS already works.
const FALLBACK_SERVERS = ['1.1.1.1', '8.8.8.8'];

function createFallbackResolver(): Resolver {
  const resolver = new Resolver();
  resolver.setServers(FALLBACK_SERVERS);
  return resolver;
}

async function resolveWithFallback<T>(
  primary: () => Promise<T>,
  fallback: (resolver: Resolver) => Promise<T>,
): Promise<T | null> {
  try {
    return await primary();
  } catch {
    try {
      return await fallback(createFallbackResolver());
    } catch {
      return null;
    }
  }
}

/**
 * Never throws - DNS lookups are best-effort signal for validators, and a
 * missing/unreachable record (ENOTFOUND, ENODATA, ETIMEOUT, ...) is a
 * normal, expected outcome, not a fault.
 */
@Injectable()
export class DnsProvider {
  async lookupA(domain: string): Promise<string[] | null> {
    return resolveWithFallback(
      () => dns.resolve4(domain),
      (resolver) => resolver.resolve4(domain),
    );
  }

  async lookupMX(domain: string): Promise<MxRecord[] | null> {
    return resolveWithFallback(
      () => dns.resolveMx(domain),
      (resolver) => resolver.resolveMx(domain),
    );
  }

  async lookupTXT(domain: string): Promise<string[][] | null> {
    return resolveWithFallback(
      () => dns.resolveTxt(domain),
      (resolver) => resolver.resolveTxt(domain),
    );
  }

  async lookupNS(domain: string): Promise<string[] | null> {
    return resolveWithFallback(
      () => dns.resolveNs(domain),
      (resolver) => resolver.resolveNs(domain),
    );
  }
}
