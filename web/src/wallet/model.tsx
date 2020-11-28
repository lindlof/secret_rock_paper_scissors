enum WalletType {
  Keplr = 'KEPLR',
  LocalWallet = 'LOCAL_WALLET',
}

const walletTypeName = new Map([
  [WalletType.Keplr, 'Keplr'],
  [WalletType.LocalWallet, 'Local'],
]);

export { WalletType, walletTypeName };
