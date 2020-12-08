interface Account {
  balance: number;
  loading: boolean;
}

enum WalletType {
  Keplr = 'KEPLR',
  LocalWallet = 'LOCAL_WALLET',
}

const walletTypeName = new Map([
  [WalletType.Keplr, 'Keplr'],
  [WalletType.LocalWallet, 'Local'],
]);

export type { Account };
export { WalletType, walletTypeName };
