import axios from 'axios';
import { wrapAxiosWithPaymentFromConfig } from '@x402/axios';
import { ExactAvmScheme } from '@x402/avm/exact/client';
import type { ClientAvmSigner } from '@x402/avm';

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

/**
 * Builds an axios instance that transparently pays x402 402 responses using
 * the connected wallet's signer - request goes out, 402 comes back, the
 * scheme builds+signs the ASA transfer payment group, retries with
 * X-PAYMENT attached.
 */
export function createPaidApiClient(signer: ClientAvmSigner) {
  return wrapAxiosWithPaymentFromConfig(
    axios.create({ baseURL: API_URL }),
    {
      schemes: [{ network: 'algorand:*', client: new ExactAvmScheme(signer) }],
    },
  );
}
