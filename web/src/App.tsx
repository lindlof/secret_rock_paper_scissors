import React, { useEffect, useState } from 'react';
import { Button, Input } from '@material-ui/core';
import * as SecretJS from 'secretjs';
import * as bip39 from 'bip39';
import { useInterval, useLocalStorage } from './utils';
import * as Msg from './msg';
import Config from './config';
import * as Game from './game';

const config = Config();

export const App: React.FC = () => {
  const [client, setClient] = useState<SecretJS.SigningCosmWasmClient | undefined>();
  const [game, setGame] = useLocalStorage<Game.Game | undefined>('game', undefined);
  const [joinContract, setJoinContract] = useState<string | undefined>();
  const [account, setAccount] = useState<SecretJS.Account | undefined>();
  const [address, setAddress] = useState();
  useEffect(() => {
    if (!client) return;
    client.getAccount(client.senderAddress).then((account) => setAccount(account));
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
          <p>
            Wallet balance: {account ? account.balance[0].amount + account.balance[0].denom : ''}
          </p>
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
          {game?.status === Game.Status.NOT_STARTED && <p>Waiting for Player 2 to join</p>}
          {client &&
            game?.status === Game.Status.GAME_ON &&
            gamePanel(game, (handsign: Msg.Handsign) =>
              playHandsign(client, game.contract, handsign),
            )}
        </div>
      ) : (
        client && (
          <div>
            {joinContract ? (
              <Button
                variant="contained"
                color="primary"
                onClick={() => joinGame(client, joinContract, setGame)}
              >
                Join game
              </Button>
            ) : (
              <Button
                variant="contained"
                color="primary"
                onClick={() => instantiateGame(client, config.codeId, setGame)}
              >
                Create game
              </Button>
            )}
            <Input placeholder="Join contract" onChange={(t) => setJoinContract(t.target.value)} />
          </div>
        )
      )}
    </div>
  );
};

const gamePanel = (game: Game.Game, playHandsign: Function) => {
  return (
    <div>
      <p>Wins: {game.wins}</p>
      <p>Losses: {game.losses}</p>
      {game.played ? (
        <p>{game.opponenPlayed ? 'Opponent played' : 'Waiting for opponent to play'}</p>
      ) : (
        <div>
          <Button variant="contained" color="primary" onClick={() => playHandsign('ROCK')}>
            Rock
          </Button>
          <Button variant="contained" color="primary" onClick={() => playHandsign('PAPER')}>
            Paper
          </Button>
          <Button variant="contained" color="primary" onClick={() => playHandsign('SCISSORS')}>
            Scissors
          </Button>
        </div>
      )}
    </div>
  );
};

const instantiateGame = async (
  client: SecretJS.SigningCosmWasmClient,
  codeId: number,
  setGame: Function,
) => {
  const result = await client.instantiate(codeId, {}, `Game ${Date.now()}`);
  setGame(Game.create(result.contractAddress, true));
};

const joinGame = async (
  client: SecretJS.SigningCosmWasmClient,
  contract: string,
  setGame: Function,
) => {
  await client.execute(
    contract,
    {
      join_game: {},
    },
    '',
    [
      {
        amount: '10',
        denom: 'uscrt',
      },
    ],
  );
  setGame(Game.create(contract, false));
};

const leaveGame = async (setGame: Function) => {
  setGame(null);
};

const playHandsign = async (
  client: SecretJS.SigningCosmWasmClient,
  contract: string,
  handsign: Msg.Handsign,
) => {
  try {
    await client.execute(
      contract,
      {
        play_hand: { handsign },
      },
      '',
      [
        {
          amount: '10',
          denom: 'uscrt',
        },
      ],
    );
  } catch (error) {
    console.log(error);
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
