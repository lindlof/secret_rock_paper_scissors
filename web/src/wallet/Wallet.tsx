import React, { useEffect, useState } from 'react';
import * as SecretJS from 'secretjs';
import { makeStyles } from '@material-ui/core/styles';
import { Button } from '@material-ui/core';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import Config from '../config';
import localWallet from './localWallet';
import keplr from './keplrWallet';

const config = Config();

const useStyles = makeStyles((theme) => ({
  root: {
    maxWidth: '15em',
  },
  paper: {
    padding: theme.spacing(2),
    textAlign: 'center',
    color: theme.palette.text.secondary,
  },
  address: {
    wordBreak: 'break-all',
  },
}));

interface Props {
  client: SecretJS.SigningCosmWasmClient | undefined;
  setClient: (client: SecretJS.SigningCosmWasmClient) => void;
  faucetUrl: string | undefined;
}

export default (props: Props) => {
  const classes = useStyles();
  const { client, setClient, faucetUrl } = props;

  useEffect(() => {
    //localWallet(config.lcdUrl, setClient);
    keplr(config.chainId, config.chainName, config.lcdUrl, config.rpcUrl, setClient);
  }, []);
  const [account, setAccount] = useState<SecretJS.Account | undefined>();
  useEffect(() => {
    if (!client) return;
    getAccount(client, setAccount);
    const interval = setInterval(() => {
      getAccount(client, setAccount);
    }, 10000);
    return () => clearInterval(interval);
  }, [client]);

  return (
    <div className={classes.root}>
      <Paper className={classes.paper}>
        <Typography variant="h5" color="textPrimary">
          Wallet
        </Typography>
        {client ? (
          <span>
            <Typography
              variant="body2"
              color="textSecondary"
              component="p"
              className={classes.address}
            >
              {client.senderAddress}
            </Typography>
            {faucetUrl && getScrtBalance(account) < 20 && (
              <Button variant="contained" color="primary" href={faucetUrl} target="blank">
                Get funds
              </Button>
            )}
            <Typography variant="body1" color="textPrimary" component="p">
              {getScrtBalance(account)} SCRT
            </Typography>
          </span>
        ) : (
          <span>Loading</span>
        )}
      </Paper>
    </div>
  );
};

const getAccount = async (client: SecretJS.SigningCosmWasmClient, setAccount: Function) => {
  try {
    const account = await client.getAccount(client.senderAddress);
    setAccount(account);
  } catch (e) {
    setAccount(undefined);
  }
};

const getScrtBalance = (account: SecretJS.Account | undefined): number => {
  if (account === undefined) return 0;
  for (let balance of account.balance) {
    if (balance.denom === 'uscrt') {
      return parseFloat(balance.amount) / 1000000;
    }
  }
  return 0;
};
