import React, { useEffect, useState } from 'react';
import { Button, Input } from '@material-ui/core';
import * as SecretJS from 'secretjs';
import * as bip39 from 'bip39';
import { useInterval, useStickyState } from './utils';
import * as Msg from './msg';
import Config from './config';

const config = Config();

export const App: React.FC = () => {
  const [client, setClient] = useState<SecretJS.SigningCosmWasmClient | undefined>();
  const [contract, setContract] = useStickyState(undefined, 'gameContract');
  const [joinContract, setJoinContract] = useState<string | undefined>();
  const [gameLobby, setGameLobby] = useState<Msg.GameLobbyResponse | undefined>();
  const [gameStatus, setGameStatus] = useState<Msg.GameStatusResponse | undefined>();
  const [address, setAddress] = useState();
  const [account, setAccount] = useState<SecretJS.Account | undefined>();
  useEffect(() => {
    if (!client) return;
    client.getAccount(client.senderAddress).then((account) => setAccount(account));
  }, [client]);
  useEffect(() => {
    initClient(setClient, setAddress);
  }, []);
  useInterval(() => {
    if (!client || !contract) return;
    if (!gameLobby?.player2_joined) {
      client.queryContractSmart(contract, { game_lobby: {} }).then((gs) => setGameLobby(gs));
    } else {
      client.queryContractSmart(contract, { game_status: {} }).then((gs) => setGameStatus(gs));
    }
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

      {contract ? (
        <div>
          <p>Game contract {contract}</p>
          <Button variant="contained" color="primary" onClick={() => leaveGame(setContract)}>
            Leave game
          </Button>
          {gameLobby && !gameLobby.player2_joined && <p>Waiting for Player 2 to join</p>}
          {client &&
            gameStatus &&
            gamePanel(gameStatus, (handsign: Msg.Handsign) =>
              playHandsign(client, contract, handsign),
            )}
        </div>
      ) : (
        client && (
          <div>
            {joinContract ? (
              <Button
                variant="contained"
                color="primary"
                onClick={() => joinGame(client, joinContract, setContract)}
              >
                Join game
              </Button>
            ) : (
              <Button
                variant="contained"
                color="primary"
                onClick={() => instantiateGame(client, config.codeId, setContract)}
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

const gamePanel = (gameStatus: Msg.GameStatusResponse, playHandsign: Function) => {
  return (
    <div>
      <p>Player 1 wins: {gameStatus.player1_wins}</p>
      <p>Player 2 wins: {gameStatus.player2_wins}</p>
      <p>{gameStatus.player1_played ? 'Player 1 played' : 'Waiting for Player 1 to play'}</p>
      <p>{gameStatus.player2_played ? 'Player 2 played' : 'Waiting for Player 2 to play'}</p>

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
  );
};

const instantiateGame = async (
  client: SecretJS.SigningCosmWasmClient,
  codeId: number,
  setContract: Function,
) => {
  const result = await client.instantiate(codeId, {}, `Game ${Date.now()}`);
  setContract(result.contractAddress);
};

const joinGame = async (
  client: SecretJS.SigningCosmWasmClient,
  contract: string,
  setContract: Function,
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
  setContract(contract);
};

const leaveGame = async (setContract: Function) => {
  setContract(null);
  localStorage.removeItem('contract');
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
