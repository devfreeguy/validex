import { Injectable } from '@nestjs/common';

export interface RDAPResult {
  registeredAt: Date | null;
  expiresAt: Date | null;
  updatedAt: Date | null;
  registrar: string | null;
  status: string[];
  domainAgeInDays: number | null;
}

interface RDAPEvent {
  eventAction?: string;
  eventDate?: string;
}

interface RDAPEntity {
  roles?: string[];
  vcardArray?: [string, unknown[][]];
}

interface RDAPResponse {
  events?: RDAPEvent[];
  entities?: RDAPEntity[];
  status?: string[];
}

const LOOKUP_TIMEOUT_MS = 8_000;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function findEventDate(
  events: RDAPEvent[] | undefined,
  ...actions: string[]
): Date | null {
  if (!events) return null;
  for (const action of actions) {
    const match = events.find(
      (event) => event.eventAction?.toLowerCase() === action,
    );
    if (match?.eventDate) {
      const date = new Date(match.eventDate);
      if (!Number.isNaN(date.getTime())) return date;
    }
  }
  return null;
}

function findRegistrarName(entities: RDAPEntity[] | undefined): string | null {
  if (!entities) return null;
  const registrar = entities.find((entity) =>
    entity.roles?.some((role) => role.toLowerCase() === 'registrar'),
  );
  const vcard = registrar?.vcardArray?.[1];
  if (!Array.isArray(vcard)) return null;
  const fn = vcard.find((entry) => Array.isArray(entry) && entry[0] === 'fn');
  const name = Array.isArray(fn) ? fn[3] : undefined;
  return typeof name === 'string' ? name : null;
}

/** Never throws - network failures and non-200 responses resolve to null. */
@Injectable()
export class RdapProvider {
  async lookup(domain: string): Promise<RDAPResult | null> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), LOOKUP_TIMEOUT_MS);

    try {
      const response = await fetch(`https://rdap.org/domain/${domain}`, {
        signal: controller.signal,
        headers: {
          Accept: 'application/rdap+json',
          // rdap.org sits behind Cloudflare, which challenges/blocks
          // Node's default fetch User-Agent as a bot signature - a
          // browser-like UA is required to get past it.
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });

      if (!response.ok) return null;

      const data = (await response.json()) as RDAPResponse;
      const registeredAt = findEventDate(data.events, 'registration');
      const expiresAt = findEventDate(data.events, 'expiration');
      const updatedAt = findEventDate(
        data.events,
        'last changed',
        'last update of rdap database',
      );
      const domainAgeInDays = registeredAt
        ? Math.floor((Date.now() - registeredAt.getTime()) / MS_PER_DAY)
        : null;

      return {
        registeredAt,
        expiresAt,
        updatedAt,
        registrar: findRegistrarName(data.entities),
        status: Array.isArray(data.status) ? data.status : [],
        domainAgeInDays,
      };
    } catch {
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }
}
