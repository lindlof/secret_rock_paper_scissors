import React, { useEffect, useState } from 'react';
import { Button, Input } from '@material-ui/core';
import * as SecretJS from 'secretjs';
import * as bip39 from 'bip39';

function App() {
  const [client, setClient] = useState(null);
  const [contract, setContract] = useState(null);
  const [joinContract, setJoinContract] = useState(null);
  const [gameStatus, setGameStatus] = useState(null);
  const [account, setAccount] = useState(null);
  useEffect(() => {
    initClient().then((c) => setClient(c));
  }, []);
  useEffect(() => {
    if (!client) return;
    client
      .queryContractSmart(contract, {
        get_outcome: {},
      })
      .then((gs) => setGameStatus(gs));
  }, [contract]);
  useEffect(() => {
    if (!client) return;
    client
      .getAccount(client.senderAddress)
      .then((account) => setAccount(account));
  }, [client]);

  return (
    <div>
      {account ? (
        <div>
          <p>Wallet address: {account.address}</p>
          <p>
            Wallet balance: {account.balance[0].amount}
            {account.balance[0].denom}
          </p>
        </div>
      ) : (
        <p>Wallet not loaded</p>
      )}

      {contract ? (
        <div>
          <p>Game contract {contract}</p>
          {gameStatus ? (
            <div>
              <p>Player 1 wins: {gameStatus.player1_wins}</p>
              <p>Player 2 wins: {gameStatus.player2_wins}</p>
            </div>
          ) : (
            <p>Loading...</p>
          )}

          <Button
            variant="contained"
            color="primary"
            onClick={() => playHandsign(client, contract, 'ROCK')}
          >
            Rock
          </Button>
        </div>
      ) : (
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
              onClick={() => instantiateGame(client, setContract)}
            >
              Create game
            </Button>
          )}
          <Input
            placeholder="Join contract"
            onChange={(t) => setJoinContract(t.target.value)}
          />
        </div>
      )}
    </div>
  );
}

const instantiateGame = async (client, setContract) => {
  const result = await client.instantiate(
    process.env.REACT_APP_CODE_ID,
    {},
    `Game ${Date.now()}`,
  );
  setContract(result.contractAddress);
  console.log(result);
};

const joinGame = async (client, contract, setContract) => {
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

const playHandsign = async (client, contract, handsign) => {
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

const initClient = async () => {
  let mnemonic = localStorage.getItem('mnemonic');
  if (!mnemonic) {
    mnemonic = bip39.generateMnemonic();
    localStorage.setItem('mnemonic', mnemonic);
  }

  let tx_encryption_seed = localStorage.getItem('tx_encryption_seed');
  if (tx_encryption_seed) {
    tx_encryption_seed = Uint8Array.from(JSON.parse(`[${tx_encryption_seed}]`));
  } else {
    tx_encryption_seed = SecretJS.EnigmaUtils.GenerateNewSeed();
    localStorage.setItem('tx_encryption_seed', tx_encryption_seed);
  }

  const signingPen = await SecretJS.Secp256k1Pen.fromMnemonic(mnemonic);
  const walletAddress = SecretJS.pubkeyToAddress(
    SecretJS.encodeSecp256k1Pubkey(signingPen.pubkey),
    'secret',
  );

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
  console.log(await secretJsClient.getAccount(walletAddress));
  return secretJsClient;
};

export default App;
