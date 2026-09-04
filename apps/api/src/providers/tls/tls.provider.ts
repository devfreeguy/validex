import { Injectable } from '@nestjs/common';
import * as tls from 'node:tls';
import type { PeerCertificate } from 'node:tls';

export interface TLSInspectResult {
  valid: boolean;
  issuer: string;
  subject: string;
  validFrom: Date;
  validTo: Date;
  daysUntilExpiry: number;
  selfSigned: boolean;
}

const CONNECT_TIMEOUT_MS = 10_000;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function formatDistinguishedName(
  name: PeerCertificate['issuer'] | PeerCertificate['subject'],
): string {
  if (!name) return '';
  return Object.entries(name)
    .map(([key, value]) => `${key}=${String(value)}`)
    .join(', ');
}

/** Never throws - an unreachable or malformed TLS endpoint resolves to null. */
@Injectable()
export class TlsProvider {
  async inspect(hostname: string): Promise<TLSInspectResult | null> {
    return new Promise((resolve) => {
      let settled = false;
      const finish = (result: TLSInspectResult | null): void => {
        if (settled) return;
        settled = true;
        socket.destroy();
        resolve(result);
      };

      const socket = tls.connect(
        {
          host: hostname,
          port: 443,
          servername: hostname,
          rejectUnauthorized: false,
          timeout: CONNECT_TIMEOUT_MS,
        },
        () => {
          try {
            const cert = socket.getPeerCertificate(true);
            if (!cert || Object.keys(cert).length === 0) {
              finish(null);
              return;
            }

            const validFrom = new Date(cert.valid_from);
            const validTo = new Date(cert.valid_to);
            const now = new Date();
            const daysUntilExpiry = Math.round(
              (validTo.getTime() - now.getTime()) / MS_PER_DAY,
            );
            const selfSigned =
              !!cert.issuerCertificate &&
              cert.issuerCertificate.fingerprint256 === cert.fingerprint256;

            finish({
              valid: socket.authorized && now >= validFrom && now <= validTo,
              issuer: formatDistinguishedName(cert.issuer),
              subject: formatDistinguishedName(cert.subject),
              validFrom,
              validTo,
              daysUntilExpiry,
              selfSigned,
            });
          } catch {
            finish(null);
          }
        },
      );

      socket.setTimeout(CONNECT_TIMEOUT_MS, () => finish(null));
      socket.on('error', () => finish(null));
    });
  }
}
