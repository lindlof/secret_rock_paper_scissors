import React from 'react';
import * as SecretJS from 'secretjs';
import { makeStyles } from '@material-ui/core/styles';
import { Button } from '@material-ui/core';
import Paper from '@material-ui/core/Paper';
import Modal from '@material-ui/core/Modal';
import { envConfig } from '../config';
import ClientLoader from './ClientLoader';
import { WalletType } from './model';

const config = envConfig();

const useStyles = makeStyles((theme) => ({
  paper: {
    position: 'absolute',
    width: 270,
    backgroundColor: theme.palette.background.paper,
    border: '2px solid #000',
    boxShadow: theme.shadows[5],
    padding: theme.spacing(1, 1, 4),
    textAlign: 'center',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  },
}));

interface Props {
  walletType: WalletType | undefined;
  setWalletType: (wallet: WalletType | undefined) => void;
  client: SecretJS.SigningCosmWasmClient | undefined;
  setClient: (client: SecretJS.SigningCosmWasmClient) => void;
}

const SelectWalletModal = (props: Props) => {
  const classes = useStyles();
  const { walletType, setWalletType, client, setClient } = props;

  return (
    <div>
      {!client && (
        <Modal
          open={true}
          aria-labelledby="simple-modal-title"
          aria-describedby="simple-modal-description"
        >
          <Paper className={classes.paper}>
            {!walletType && (
              <div>
                <h2>Select wallet</h2>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => setWalletType(WalletType.Keplr)}
                >
                  Use Keplr
                </Button>
                {config.enableLocalWallet && (
                  <Button variant="contained" onClick={() => setWalletType(WalletType.LocalWallet)}>
                    Local wallet
                  </Button>
                )}
              </div>
            )}
            {walletType && (
              <ClientLoader
                walletType={walletType}
                config={config}
                setClient={setClient}
                cancel={() => setWalletType(undefined)}
              />
            )}
          </Paper>
        </Modal>
      )}
    </div>
  );
};

export default SelectWalletModal;
