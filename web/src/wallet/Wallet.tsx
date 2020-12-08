import React, { useEffect, useState } from 'react';
import * as SecretJS from 'secretjs';
import { makeStyles } from '@material-ui/core/styles';
import { Button } from '@material-ui/core';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardActions from '@material-ui/core/CardActions';
import Typography from '@material-ui/core/Typography';
import SelectWalletModal from './SelectWalletModal';
import CircularProgress from '@material-ui/core/CircularProgress';
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
  progress: {
    marginRight: '0.7rem',
  },
}));

interface Props {
  client: SecretJS.SigningCosmWasmClient | undefined;
  setClient: (client: SecretJS.SigningCosmWasmClient | undefined) => void;
  faucetUrl: string | undefined;
  refreshBalance: Object;
}

interface Account {
  balance: number;
  loading: boolean;
}

const Wallet = (props: Props) => {
  const classes = useStyles();
  const { client, setClient, faucetUrl, refreshBalance } = props;
  const [walletType, setWalletType] = useLocalStorage<WalletType | undefined>(
    'wallet_type',
    undefined,
  );

  const [account, setAccount] = useState<Account | undefined>();
  useEffect(() => {
    if (!client) return;
    getAccount(client, setAccount);
    const interval = setInterval(() => {
      getAccount(client, setAccount);
    }, 10000);
    return () => clearInterval(interval);
  }, [client, refreshBalance]);

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
              {faucetUrl && account && account.balance < 20 && (
                <Button variant="contained" color="primary" href={faucetUrl} target="blank">
                  Get funds
                </Button>
              )}
              <Typography variant="body1" color="textPrimary" component="p">
                {!account?.loading && (
                  <CircularProgress color="secondary" size="1rem" className={classes.progress} />
                )}
                {account?.balance} SCRT
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
    setAccount({ balance: getScrtBalance(account), loading: true });
  } catch {
    setAccount((a: Account) => ({ ...a, loading: false }));
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

export default Wallet;
