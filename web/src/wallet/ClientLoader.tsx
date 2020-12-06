import React, { useEffect } from 'react';
import { Button } from '@material-ui/core';
import { Config } from '../config';
import CircularProgress from '@material-ui/core/CircularProgress';
import Grid from '@material-ui/core/Grid';
import localWallet from './localWallet';
import keplr from './keplrWallet';
import { WalletType, walletTypeName } from './model';

interface Props {
  walletType: WalletType;
  config: Config;
  setClient: Function;
  cancel: Function;
}

const ClientLoader = (props: React.PropsWithChildren<Props>) => {
  const { walletType, config, setClient, cancel } = props;

  useEffect(() => {
    const timer = setInterval(async () => {
      switch (walletType) {
        case WalletType.Keplr:
          await keplr(
            config.chainId,
            config.chainName,
            config.suggestChain,
            config.lcdUrl,
            config.rpcUrl,
            setClient,
          );
          break;
        case WalletType.LocalWallet:
          localWallet(config.lcdUrl, setClient);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [
    walletType,
    config.chainId,
    config.chainName,
    config.suggestChain,
    config.lcdUrl,
    config.rpcUrl,
    setClient,
  ]);

  return (
    <div>
      <h2>Loading wallet</h2>
      <p>
        {walletType === WalletType.LocalWallet &&
          `${walletTypeName.get(walletType)} wallet should be ready shortly`}
        {walletType === WalletType.Keplr &&
          `Make sure you have ${walletTypeName.get(walletType)} extension installed`}
      </p>
      <div>
        <Grid container spacing={3} alignItems="flex-end">
          <Grid item xs={4} sm={6}>
            <CircularProgress />
          </Grid>
          <Grid item xs={8} sm={6}>
            <Button variant="contained" color="primary" onClick={() => cancel()}>
              Cancel
            </Button>
          </Grid>
        </Grid>
      </div>
    </div>
  );
};

export default ClientLoader;
