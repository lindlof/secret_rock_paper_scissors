import React, { useEffect, useState } from 'react';
import { Button } from '@material-ui/core';
import * as SecretJS from 'secretjs';
import { useLocalStorage } from './utils';
import * as Msg from './msg';
import Config from './config';
import * as Game from './game';
import GamePlaying from './GamePlaying';
import { useSnackbar } from 'notistack';
import Wallet from './wallet/Wallet';
import Banner from './Banner';
import Grid from '@material-ui/core/Grid';
import CircularProgress from '@material-ui/core/CircularProgress';
import GameTicker from './components/GameTicker';

const config = Config();

export const App: React.FC = () => {
  const [client, setClient] = useState<SecretJS.SigningCosmWasmClient | undefined>();
  const [game, setGame] = useLocalStorage<Game.Game | null | undefined>('game', undefined);
  const { enqueueSnackbar } = useSnackbar();

  return (
    <div>
      <Grid container spacing={3} alignItems="flex-end">
        <Grid item xs={12} sm={8}>
          <Banner />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Wallet client={client} setClient={setClient} faucetUrl={config.faucetUrl} />
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

  const game = Game.create(contract);
  try {
    await client.execute(contract, { join_game: { locator: game.locator } }, undefined, [
      {
        amount: '10000000',
        denom: 'uscrt',
      },
    ]);
  } catch (e) {
    if (e.message !== 'ciphertext not set') {
      setGame(undefined);
      enqueueSnackbar('Fail. Try funding wallet?', { variant: 'error' });
      console.log('playGame error', e);
      return;
    }
  }
  setGame(game);
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

export default App;
