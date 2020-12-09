import React, { useState } from 'react';
import { Button, Typography } from '@material-ui/core';
import Box from '@material-ui/core/Box';
import * as SecretJS from 'secretjs';
import { useLocalStorage } from './utils';
import * as Msg from './msg';
import { envConfig } from './config';
import * as Game from './game';
import GamePlaying from './GamePlaying';
import { useSnackbar } from 'notistack';
import Wallet from './wallet/Wallet';
import useAccount from './wallet/useAccount';
import Banner from './Banner';
import Grid from '@material-ui/core/Grid';
import CircularProgress from '@material-ui/core/CircularProgress';
import GameTicker from './components/GameTicker';

const config = envConfig();

export const App: React.FC = () => {
  const [client, setClient] = useState<SecretJS.SigningCosmWasmClient | undefined>();
  const [game, setGame] = useLocalStorage<Game.Game | null | undefined>(
    'game',
    undefined,
    Game.defaults,
  );
  const account = useAccount(client, game);
  const lowBalance = account && account.balance < 11;
  const { enqueueSnackbar } = useSnackbar();
  routeUrl(client, setGame, enqueueSnackbar);

  return (
    <div>
      <Grid container spacing={3} justify="flex-end">
        <Grid item xs={12} sm={8}>
          <Banner />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Grid container justify="flex-end">
            <Wallet
              account={account}
              client={client}
              setClient={setClient}
              faucetUrl={config.faucetUrl}
            />
          </Grid>
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
            claimInactivity={async () => setGame(await Game.claimInactivity(client, game))}
            enqueueSnackbar={enqueueSnackbar}
          />
        </GameTicker>
      )}
      {game === null && <CircularProgress />}
      {game === undefined && client && (
        <Grid container direction="column" justify="center" alignItems="center" spacing={1}>
          <Grid item xs={12}>
            <Box bgcolor="secondary.main" color="primary.contrastText" p={1}>
              {lowBalance && (
                <div>
                  <Typography>11 SCRT required to play</Typography>
                  <Typography variant="subtitle2" align="center">
                    (10 SCRT entry + fees)
                  </Typography>
                </div>
              )}
              {!lowBalance && <Typography>Play for 10 SCRT</Typography>}
            </Box>
          </Grid>
          <Grid item xs={12}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              disabled={lowBalance}
              onClick={() => playGame(client, config.contract, true, setGame, enqueueSnackbar)}
            >
              Play with Friend
            </Button>
          </Grid>
          <Grid item xs={12}>
            <Button
              variant="contained"
              color="primary"
              disabled={lowBalance}
              onClick={() => playGame(client, config.contract, false, setGame, enqueueSnackbar)}
            >
              Play with Anyone
            </Button>
          </Grid>
        </Grid>
      )}
    </div>
  );
};

const playGame = async (
  client: SecretJS.SigningCosmWasmClient,
  contract: string,
  privateGame: boolean,
  setGame: Function,
  enqueueSnackbar: Function,
  locator?: string,
) => {
  setGame(null, false);

  const game = Game.create(contract, privateGame, locator);
  const method = privateGame ? 'private_game' : 'join_game';
  try {
    await client.execute(contract, { [method]: { locator: game.locator } }, undefined, [
      {
        amount: '10000000',
        denom: 'uscrt',
      },
    ]);
  } catch (e) {
    if (e.message !== 'ciphertext not set') {
      setGame(undefined);
      enqueueSnackbar('Failed', { variant: 'error' });
      console.log('playGame error', e);
      return;
    }
  }
  setGame(game);
};

const routeUrl = (
  client: SecretJS.SigningCosmWasmClient | undefined,
  setGame: Function,
  enqueueSnackbar: Function,
) => {
  const url = new URL(window.location.href);
  const joinLocator = url.searchParams.get('game');
  if (client && joinLocator) {
    playGame(client, config.contract, true, setGame, enqueueSnackbar, joinLocator);
    window.history.pushState('', '', document.location.origin);
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

export default App;
