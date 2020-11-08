import React, { useEffect, useState } from 'react';
import * as SecretJS from 'secretjs';
import { makeStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';

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
}

export default (props: Props) => {
  const classes = useStyles();
  const { client } = props;

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
            <Typography variant="body1" color="textPrimary" component="p">
              {account ? getScrtBalance(account.balance) : 0} SCRT
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

const getScrtBalance = (balances: readonly SecretJS.types.Coin[]): number => {
  for (let balance of balances) {
    if (balance.denom === 'uscrt') {
      return parseFloat(balance.amount) / 1000000;
    }
  }
  return 0;
};
