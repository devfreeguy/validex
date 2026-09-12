import { NetworkId, WalletManager } from '@txnlab/use-wallet-react';
import { pera } from '@txnlab/use-wallet-pera';
import { defly } from '@txnlab/use-wallet-defly';
import { lute } from '@txnlab/use-wallet-lute';

// Must match the API's own NETWORK - the wallet has to sign transactions
// for the same Algorand network the server's x402 payment requirements
// (and facilitator) are configured for, or settlement will fail.
const rawNetwork = process.env.NEXT_PUBLIC_NETWORK ?? 'testnet';
export const network: 'testnet' | 'mainnet' =
  rawNetwork === 'mainnet' ? 'mainnet' : 'testnet';

const defaultNetwork =
  network === 'mainnet' ? NetworkId.MAINNET : NetworkId.TESTNET;

export const walletManager = new WalletManager({
  wallets: [pera(), defly(), lute()],
  defaultNetwork,
});
