import React, { useEffect, useState } from 'react';
import * as SecretJS from 'secretjs';
import * as bip39 from 'bip39';

function App() {
  const [client, setClient] = useState(null);
  const [gameStatus, setGameStatus] = useState(null);
  const [account, setAccount] = useState(null);
  useEffect(() => {
    initClient().then((c) => setClient(c));
  }, []);
  useEffect(() => {
    if (!client) return;
    client
      .queryContractSmart(process.env.REACT_APP_CONTRACT, {
        get_outcome: {},
      })
      .then((gs) => setGameStatus(gs));
  }, [client]);
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

      {gameStatus ? (
        <div>
          <p>Player 1 wins: {gameStatus.player1_wins}</p>
          <p>Player 2 wins: {gameStatus.player2_wins}</p>
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}

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
