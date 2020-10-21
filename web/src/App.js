import React, {useEffect, useState} from 'react';
import * as SecretJS from "secretjs";
import * as bip39 from "bip39";

function App() {
  const [client, setClient] = useState();
  useEffect(() => {
    initClient()
      .then(c => setClient(c));
  }, [])

  return (
    <div className="App">
      <header className="App-header">
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

const initClient = async () => {
  let mnemonic = localStorage.getItem("mnemonic");
  if (!mnemonic) {
    mnemonic = bip39.generateMnemonic();
    localStorage.setItem("mnemonic", mnemonic);
  }

  let tx_encryption_seed = localStorage.getItem("tx_encryption_seed");
  if (tx_encryption_seed) {
    tx_encryption_seed = Uint8Array.from(
      JSON.parse(`[${tx_encryption_seed}]`)
    );
  } else {
    tx_encryption_seed = SecretJS.EnigmaUtils.GenerateNewSeed();
    localStorage.setItem("tx_encryption_seed", tx_encryption_seed);
  }

  const signingPen = await SecretJS.Secp256k1Pen.fromMnemonic(mnemonic);
  const myWalletAddress = SecretJS.pubkeyToAddress(
    SecretJS.encodeSecp256k1Pubkey(signingPen.pubkey),
    "secret"
  );

  const secretJsClient = new SecretJS.SigningCosmWasmClient(
    "http://localhost:1338",
    myWalletAddress,
    (signBytes) => signingPen.sign(signBytes),
    tx_encryption_seed,
    {
      init: {
        amount: [{ amount: "250000", denom: "uscrt" }],
        gas: "250000",
      },
      exec: {
        amount: [{ amount: "250000", denom: "uscrt" }],
        gas: "250000",
      },
    }
  );
  //console.log(await secretJsClient.getAccount(myWalletAddress));
  console.log(await secretJsClient.queryContractSmart(
    "secret18vd8fpwxzck93qlwghaj6arh4p7c5n8978vsyg",
    { get_outcome: {} }
  ));
  return secretJsClient;
}

export default App;
