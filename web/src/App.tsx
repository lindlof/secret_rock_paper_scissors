import React, { useEffect, useState } from 'react';
import { Button } from '@material-ui/core';
import * as SecretJS from 'secretjs';
import * as bip39 from 'bip39';
import { useInterval, useLocalStorage } from './utils';
import * as Msg from './msg';
import Config from './config';
import * as Game from './game';
import GamePlaying from './GamePlaying';
import { useSnackbar } from 'notistack';

const config = Config();

export const App: React.FC = () => {
  const [client, setClient] = useState<SecretJS.SigningCosmWasmClient | undefined>();
  const [game, setGame] = useLocalStorage<Game.Game | undefined>('game', undefined);
  const [balance, setBalance] = useState<number | undefined>();
  const [address, setAddress] = useState();
  const { enqueueSnackbar } = useSnackbar();
  useEffect(() => {
    if (!client) return;
    client.getAccount(client.senderAddress).then((account) => {
      if (!account) return;
      for (let balance of account.balance) {
        if (balance.denom === 'uscrt') {
          setBalance(parseFloat(balance.amount) / 1000000);
          return;
        }
      }
    });
  }, [client]);
  useEffect(() => {
    initClient(setClient, setAddress);
  }, []);
  useInterval(async () => {
    if (!client || !game) return;
    setGame(await Game.tick(client, game));
  }, 1000 * 2);

  return (
    <div>
      {address ? (
        <div>
          <p>Wallet address: {address}</p>
          <p>Wallet balance: {balance} SCRT</p>
        </div>
      ) : (
        <p>Wallet not loaded</p>
      )}

      {game ? (
        <div>
          <p>Game contract {game.contract}</p>
          <Button variant="contained" color="primary" onClick={() => leaveGame(setGame)}>
            Leave game
          </Button>
          {game?.stage === Game.Stage.NOT_STARTED && <p>Waiting for Player 2 to join</p>}
          {game.stage === Game.Stage.ENDED && <p>You {game.won ? 'won' : 'lost'}</p>}
          {client && game?.stage === Game.Stage.GAME_ON && (
            <GamePlaying
              game={game}
              playHandsign={(handsign: Msg.Handsign) =>
                playHandsign(client, game, handsign, setGame, enqueueSnackbar)
              }
            />
          )}
        </div>
      ) : (
        client && (
          <div>
            <Button
              variant="contained"
              color="primary"
              onClick={() => playGame(client, config.codeId, setGame, enqueueSnackbar)}
            >
              Play
            </Button>
          </div>
        )
      )}
    </div>
  );
};

const playGame = async (
  client: SecretJS.SigningCosmWasmClient,
  codeId: number,
  setGame: Function,
  enqueueSnackbar: Function,
) => {
  try {
    for await (let lobby of findLobbies(client, codeId)) {
      await client.execute(lobby.address, { join_game: {} }, undefined, [
        {
          amount: '1000000',
          denom: 'uscrt',
        },
      ]);
      setGame(Game.create(lobby.address, false));
      return;
    }
    const result = await client.instantiate(codeId, {}, `Game ${Date.now()}`, undefined, [
      {
        amount: '1000000',
        denom: 'uscrt',
      },
    ]);
    setGame(Game.create(result.contractAddress, true));
  } catch (e) {
    enqueueSnackbar('Fail. Try funding wallet?', { variant: 'error' });
    console.log('playGame error', e);
    return;
  }
};

async function* findLobbies(client: SecretJS.SigningCosmWasmClient, codeId: number) {
  const contracts = await client.getContracts(codeId);
  for (let contract of Array.from(contracts).reverse()) {
    const lobby = await client.queryContractSmart(contract.address, { game_lobby: {} });
    if (!lobby.player2_joined) {
      yield contract;
    }
  }
}

const leaveGame = async (setGame: Function) => {
  setGame(null);
};

const playHandsign = async (
  client: SecretJS.SigningCosmWasmClient,
  game: Game.Game,
  handsign: Msg.Handsign,
  setGame: Function,
  enqueueSnackbar: Function,
) => {
  try {
    setGame(await Game.playHandsign(client, game, handsign));
  } catch (error) {
    enqueueSnackbar('Secret error', { variant: 'error' });
  }
};

const initClient = async (setClient: Function, setAddress: Function) => {
  let mnemonic = localStorage.getItem('mnemonic');
  if (!mnemonic) {
    mnemonic = bip39.generateMnemonic();
    localStorage.setItem('mnemonic', mnemonic);
  }

  let tx_encryption_seed: Uint8Array;
  const tx_encryption_seed_storage = localStorage.getItem('tx_encryption_seed');
  if (tx_encryption_seed_storage) {
    tx_encryption_seed = Uint8Array.from(JSON.parse(`[${tx_encryption_seed_storage}]`));
  } else {
    tx_encryption_seed = SecretJS.EnigmaUtils.GenerateNewSeed();
    localStorage.setItem('tx_encryption_seed', tx_encryption_seed.toString());
  }

  const signingPen = await SecretJS.Secp256k1Pen.fromMnemonic(mnemonic);
  const walletAddress = SecretJS.pubkeyToAddress(
    SecretJS.encodeSecp256k1Pubkey(signingPen.pubkey),
    'secret',
  );
  setAddress(walletAddress);

  const secretJsClient = new SecretJS.SigningCosmWasmClient(
    'http://localhost:1338',
    walletAddress,
    (signBytes) => signingPen.sign(signBytes),
    tx_encryption_seed,
    {
      init: {
        amount: [{ amount: '250000', denom: 'uscrt' }],
        gas: '250000',
      },
      exec: {
        amount: [{ amount: '250000', denom: 'uscrt' }],
        gas: '250000',
      },
    },
  );
  setClient(secretJsClient);
  return secretJsClient;
};

export default App;
