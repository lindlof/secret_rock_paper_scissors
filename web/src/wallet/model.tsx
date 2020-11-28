enum WalletType {
  Keplr = 'KEPLR',
  LocalWallet = 'LOCAL_WALLET',
}

const walletTypeName = {
  [WalletType.Keplr]: 'Keplr',
  [WalletType.LocalWallet]: 'Local wallet',
};

export { WalletType, walletTypeName };
