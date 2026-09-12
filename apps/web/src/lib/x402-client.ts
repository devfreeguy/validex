import axios from 'axios';
import { wrapAxiosWithPaymentFromConfig } from '@x402/axios';
import { ExactAvmScheme } from '@x402/avm/exact/client';
import type { ClientAvmSigner } from '@x402/avm';

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

/**
 * Algorand Algod endpoints used to fetch suggestedParams when building the
 * x402 payment transaction group.
 *
 * These must be well-synchronized nodes so the transaction's firstValid/lastValid
 * window matches what the GoPlausible facilitator's node sees at simulation time.
 * Using the default AlgorandClient.testNet() / mainNet() hits an unspecified
 * public node that can lag behind the facilitator, causing:
 *   "txn dead: round X outside of Y--Z"
 *
 * Nodely's free public endpoints are stable and kept in close sync with the
 * canonical Algorand network state.
 */
const ALGOD_ENDPOINTS: Record<string, { url: string; token: string }> = {
  testnet: {
    url: 'https://testnet-api.4160.nodely.dev',
    token: '',
  },
  mainnet: {
    url: 'https://mainnet-api.4160.nodely.dev',
    token: '',
  },
};

const NETWORK = process.env.NEXT_PUBLIC_NETWORK ?? 'testnet';
const algodConfig = ALGOD_ENDPOINTS[NETWORK] ?? ALGOD_ENDPOINTS.testnet;

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
      schemes: [
        {
          network: 'algorand:*',
          client: new ExactAvmScheme(signer, {
            // Pin the Algod server so transaction suggested params (firstValid,
            // lastValid, fee) come from a stable, well-synced node. This keeps
            // the validity window in step with what the GoPlausible facilitator
            // sees when it simulates the signed transaction group.
            algodUrl: algodConfig.url,
            algodToken: algodConfig.token,
          }),
        },
      ],
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
