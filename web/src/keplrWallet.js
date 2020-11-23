import * as SecretJS from 'secretjs';

export default async (chainId, chainName, lcdUrl, rpcUrl, setClient) => {
  // Keplr extension injects the offline signer that is compatible with cosmJS.
  // You can get this offline signer from `window.getOfflineSigner(chainId:string)` after load event.
  // And it also injects the helper function to `window.keplr`.
  // If `window.getOfflineSigner` or `window.keplr` is null, Keplr extension may be not installed on browser.
  if (!window.getOfflineSigner || !window.keplr) {
    alert('Please install keplr extension');
  } else {
    if (window.keplr.experimentalSuggestChain) {
      try {
        await window.keplr.experimentalSuggestChain({
          // Chain-id of the Cosmos SDK chain.
          chainId,
          // The name of the chain to be displayed to the user.
          chainName,
          // RPC endpoint of the chain.
          rpc: rpcUrl,
          // REST endpoint of the chain.
          rest: lcdUrl,
          // Staking coin information
          stakeCurrency: {
            // Coin denomination to be displayed to the user.
            coinDenom: 'SCRT',
            // Actual denom (i.e. uatom, uscrt) used by the blockchain.
            coinMinimalDenom: 'uscrt',
            // # of decimal points to convert minimal denomination to user-facing denomination.
            coinDecimals: 6,
            // (Optional) Keplr can show the fiat value of the coin if a coingecko id is provided.
            // You can get id from https://api.coingecko.com/api/v3/coins/list if it is listed.
            // coinGeckoId: ""
          },
          // (Optional) If you have a wallet webpage used to stake the coin then provide the url to the website in `walletUrlForStaking`.
          // The 'stake' button in Keplr extension will link to the webpage.
          // walletUrlForStaking: "",
          // The BIP44 path.
          bip44: {
            // You can only set the coin type of BIP44.
            // 'Purpose' is fixed to 44.
            coinType: 529,
          },
          // Bech32 configuration to show the address to user.
          // This field is the interface of
          // {
          //   bech32PrefixAccAddr: string;
          //   bech32PrefixAccPub: string;
          //   bech32PrefixValAddr: string;
          //   bech32PrefixValPub: string;
          //   bech32PrefixConsAddr: string;
          //   bech32PrefixConsPub: string;
          // }
          bech32Config: {
            bech32PrefixAccAddr: 'secret',
            bech32PrefixAccPub: 'secretpub',
            bech32PrefixValAddr: 'secretvaloper',
            bech32PrefixValPub: 'secretvaloperpub',
            bech32PrefixConsAddr: 'secretvalcons',
            bech32PrefixConsPub: 'secretvalconspub',
          },
          // List of all coin/tokens used in this chain.
          currencies: [
            {
              coinDenom: 'SCRT',
              coinMinimalDenom: 'uscrt',
              coinDecimals: 6,
            },
          ],
          // List of coin/tokens used as a fee token in this chain.
          feeCurrencies: [
            {
              coinDenom: 'SCRT',
              coinMinimalDenom: 'uscrt',
              coinDecimals: 6,
            },
          ],
          // (Optional) The number of the coin type.
          // This field is only used to fetch the address from ENS.
          // Ideally, it is recommended to be the same with BIP44 path's coin type.
          // However, some early chains may choose to use the Cosmos Hub BIP44 path of '118'.
          // So, this is separated to support such chains.
          coinType: 529,
          // (Optional) This is used to set the fee of the transaction.
          // If this field is not provided, Keplr extension will set the default gas price as (low: 0.01, average: 0.025, high: 0.04).
          // Currently, Keplr doesn't support dynamic calculation of the gas prices based on on-chain data.
          // Make sure that the gas prices are higher than the minimum gas prices accepted by chain validators and RPC/REST endpoint.
          gasPriceStep: {
            low: 0.01,
            average: 0.025,
            high: 0.04,
          },
        });
      } catch {
        alert('Failed to suggest the chain');
      }
    } else {
      alert('Please use the recent version of keplr extension');
    }
  }

  // You should request Keplr to enable the wallet.
  // This method will ask the user whether or not to allow access if they haven't visited this website.
  // Also, it will request user to unlock the wallet if the wallet is locked.
  // If you don't request enabling before usage, there is no guarantee that other methods will work.
  await window.keplr.enable(chainId);

  const offlineSigner = window.getOfflineSigner(chainId);

  // You can get the address/public keys by `getAccounts` method.
  // It can return the array of address/public key.
  // But, currently, Keplr extension manages only one address/public key pair.
  const accounts = await offlineSigner.getAccounts();

  let tx_encryption_seed;
  const tx_encryption_seed_storage = localStorage.getItem('tx_encryption_seed');
  if (tx_encryption_seed_storage) {
    tx_encryption_seed = Uint8Array.from(JSON.parse(`[${tx_encryption_seed_storage}]`));
  } else {
    tx_encryption_seed = SecretJS.EnigmaUtils.GenerateNewSeed();
    localStorage.setItem('tx_encryption_seed', tx_encryption_seed.toString());
  }

  // Initialize the gaia api with the offline signer that is injected by Keplr extension.
  const secretJsClient = new SecretJS.SigningCosmWasmClient(
    lcdUrl,
    accounts[0].address,
    async (signBytes) => {
      const signDoc = JSON.parse(new TextDecoder('utf-8').decode(signBytes));
      console.log('signDoc', signDoc);
      const sig = await offlineSigner.sign(accounts[0].address, signDoc);
      console.log(sig);
      return sig.signature;
    },
    tx_encryption_seed,
    {
      init: {
        amount: [{ amount: '6250', denom: 'uscrt' }],
        gas: '250000',
      },
      exec: {
        amount: [{ amount: '6250', denom: 'uscrt' }],
        gas: '250000',
      },
    },
  );

  setClient(secretJsClient);
};
