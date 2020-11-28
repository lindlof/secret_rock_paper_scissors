import React, { useEffect } from 'react';
import { Button } from '@material-ui/core';
import { Config } from '../config';
import CircularProgress from '@material-ui/core/CircularProgress';
import localWallet from './localWallet';
import keplr from './keplrWallet';
import { WalletType } from './model';

interface Props {
  walletType: WalletType;
  config: Config;
  setClient: Function;
  cancel: Function;
}

export default (props: React.PropsWithChildren<Props>) => {
  const { walletType, config, setClient, cancel } = props;

  useEffect(() => {
    const timer = setInterval(async () => {
      switch (walletType) {
        case WalletType.Keplr:
          keplr(config.chainId, config.chainName, config.lcdUrl, config.rpcUrl, setClient);
          break;
        case WalletType.LocalStorage:
          localWallet(config.lcdUrl, setClient);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [walletType, config.chainId, config.chainName, config.lcdUrl, config.rpcUrl, setClient]);

  return (
    <div>
      <h2>Loading {walletType}</h2>
      <div>
        <CircularProgress />
      </div>
      <div>
        <Button variant="contained" color="primary" onClick={() => cancel()}>
          Cancel
        </Button>
      </div>
    </div>
  );
};
