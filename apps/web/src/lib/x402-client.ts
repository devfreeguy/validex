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
 * PAYMENT-SIGNATURE attached (x402 v2 - not the legacy v1 X-PAYMENT header).
 */
export function createPaidApiClient(signer: ClientAvmSigner) {
  return wrapAxiosWithPaymentFromConfig(
    axios.create({ baseURL: API_URL }),
    {
      schemes: [{ network: 'algorand:*', client: new ExactAvmScheme(signer) }],
      // @x402/core's default spendControls only allows assets its own
      // findDefaultAsset() recognizes, capped at $1/payment - our testnet
      // USDC (10458941) isn't one of those, so every payment gets rejected
      // client-side before a payload is even built. This client only ever
      // talks to our own API, whose PaymentRequirements (asset + price)
      // are already authoritative, so there's no untrusted third-party
      // resource here for spendControls to protect against.
      spendControls: false,
    },
  );
}
