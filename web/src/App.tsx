import React, { useEffect, useState } from 'react';
import { Button } from '@material-ui/core';
import * as SecretJS from 'secretjs';
import * as bip39 from 'bip39';
import { useLocalStorage } from './utils';
import * as Msg from './msg';
import Config from './config';
import * as Game from './game';
import GamePlaying from './GamePlaying';
import { useSnackbar } from 'notistack';
import Wallet from './Wallet';
import Banner from './Banner';
import Grid from '@material-ui/core/Grid';
import CircularProgress from '@material-ui/core/CircularProgress';
import GameTicker from './components/GameTicker';

const config = Config();

export const App: React.FC = () => {
  const [client, setClient] = useState<SecretJS.SigningCosmWasmClient | undefined>();
  const [game, setGame] = useLocalStorage<Game.Game | null | undefined>('game', undefined);
  const { enqueueSnackbar } = useSnackbar();
  useEffect(() => {
    initClient(setClient);
  }, []);

  return (
    <div>
      <Grid container spacing={3} alignItems="flex-end">
        <Grid item xs={12} sm={8}>
          <Banner />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Wallet client={client} faucetUrl={config.faucetUrl} />
        </Grid>
      </Grid>
      {client && game && (
        <GameTicker client={client} game={game} setGame={setGame}>
          <GamePlaying
            game={game}
            playHandsign={(handsign: Msg.Handsign) =>
              playHandsign(client, game, handsign, setGame, enqueueSnackbar)
            }
            leaveGame={() => setGame(undefined)}
            claimInactivity={() => claimInactivity(client, game, setGame, enqueueSnackbar)}
          />
        </GameTicker>
      )}
      {game === null && <CircularProgress />}
      {game === undefined && client && (
        <div>
          <Button
            variant="contained"
            color="primary"
            onClick={() => playGame(client, config.contract, setGame, enqueueSnackbar)}
          >
            Play
          </Button>
        </div>
      )}
    </div>
  );
};

const playGame = async (
  client: SecretJS.SigningCosmWasmClient,
  contract: string,
  setGame: Function,
  enqueueSnackbar: Function,
) => {
  setGame(null, false);

  try {
    const game = Game.create(contract);
    await client.execute(contract, { join_game: { locator: game.locator } }, undefined, [
      {
        amount: '10000000',
        denom: 'uscrt',
      },
    ]);
    setGame(game);
  } catch (e) {
    setGame(undefined);
    enqueueSnackbar('Fail. Try funding wallet?', { variant: 'error' });
    console.log('playGame error', e);
    return;
  }
};

const playHandsign = async (
  client: SecretJS.SigningCosmWasmClient,
  game: Game.Game,
  handsign: Msg.Handsign,
  setGame: Function,
  enqueueSnackbar: Function,
) => {
  setGame((g: Game.Game) => ({ ...g, lastHandsign: handsign }));
  try {
    await Game.playHandsign(client, game, handsign);
  } catch (error) {
    setGame((g: Game.Game) => ({ ...g, lastHandsign: undefined }));
    enqueueSnackbar('Secret error', { variant: 'error' });
  }
};

const claimInactivity = async (
  client: SecretJS.SigningCosmWasmClient,
  game: Game.Game,
  setGame: Function,
  enqueueSnackbar: Function,
): Promise<void> => {
  try {
    setGame(await Game.claimInactivity(client, game));
  } catch (error) {
    enqueueSnackbar('Secret error', { variant: 'error' });
  }
};

const initClient = async (setClient: Function) => {
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

  const secretJsClient = new SecretJS.SigningCosmWasmClient(
    config.lcdUrl,
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
