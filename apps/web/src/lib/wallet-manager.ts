import { NetworkId, WalletManager } from '@txnlab/use-wallet-react';
import { pera } from '@txnlab/use-wallet-pera';
import { mnemonic } from '@txnlab/use-wallet-mnemonic';

// Mnemonic wallet is testnet-only (enforced by the adapter itself) - it
// exists purely so this demo can be tried without a mobile wallet app.
export const walletManager = new WalletManager({
  wallets: [pera(), mnemonic()],
  defaultNetwork: NetworkId.TESTNET,
});
