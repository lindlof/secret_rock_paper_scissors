import React, { useEffect, useState } from 'react';
import * as SecretJS from 'secretjs';
import { makeStyles } from '@material-ui/core/styles';
import { Button } from '@material-ui/core';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardActions from '@material-ui/core/CardActions';
import Typography from '@material-ui/core/Typography';
import SelectWalletModal from './SelectWalletModal';
import { WalletType, walletTypeName } from './model';
import { useLocalStorage } from '../utils';

const useStyles = makeStyles((theme) => ({
  root: {
    maxWidth: '15em',
  },
  card: {
    textAlign: 'center',
    color: theme.palette.text.secondary,
  },
  cardActions: {},
  address: {
    wordBreak: 'break-all',
  },
}));

interface Props {
  client: SecretJS.SigningCosmWasmClient | undefined;
  setClient: (client: SecretJS.SigningCosmWasmClient | undefined) => void;
  faucetUrl: string | undefined;
}

export default (props: Props) => {
  const classes = useStyles();
  const { client, setClient, faucetUrl } = props;
  const [walletType, setWalletType] = useLocalStorage<WalletType | undefined>(
    'wallet_type',
    undefined,
  );

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
      <SelectWalletModal
        walletType={walletType}
        setWalletType={setWalletType}
        client={client}
        setClient={setClient}
      />
      <Card className={classes.card}>
        <CardContent>
          <Typography variant="h5" color="textPrimary" gutterBottom>
            {`${walletTypeName.get(walletType) || ''} Wallet`}
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
        </CardContent>
        <CardActions className={classes.cardActions}>
          <Button
            size="small"
            onClick={() => {
              setClient(undefined);
              setWalletType(undefined);
            }}
          >
            Change
          </Button>
        </CardActions>
      </Card>
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
