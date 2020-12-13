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
import GameTicker from './components/GameTicker';

const config = envConfig();

export const App: React.FC = () => {
  const [client, setClient] = useState<SecretJS.SigningCosmWasmClient | undefined>();
  const [game, setGame, loadGame] = useLocalStorage<Game.Game | undefined>(
    'game',
    undefined,
    Game.defaults,
  );
  const account = useAccount(client, game);
  const lowBalance = account && account.balance < 11;
  const { enqueueSnackbar } = useSnackbar();
  routeUrl(client, setGame, loadGame, enqueueSnackbar);

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
            leaveGame={() => leaveGame(setGame, loadGame)}
            claimInactivity={() => claimInactivity(client, game, setGame, enqueueSnackbar)}
            enqueueSnackbar={enqueueSnackbar}
          />
        </GameTicker>
      )}
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
              onClick={() =>
                playGame(client, config.contract, true, setGame, loadGame, enqueueSnackbar)
              }
            >
              Play with Friend
            </Button>
          </Grid>
          <Grid item xs={12}>
            <Button
              variant="contained"
              color="primary"
              disabled={lowBalance}
              onClick={() =>
                playGame(client, config.contract, false, setGame, loadGame, enqueueSnackbar)
              }
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
  loadGame: Function,
  enqueueSnackbar: Function,
  locator?: string,
) => {
  const currentGame = loadGame();
  if (currentGame !== undefined) {
    setGame(currentGame);
    return;
  }
  const game = Game.create(contract, privateGame, locator);
  setGame(game);
  const method = privateGame ? 'private_game' : 'join_game';
  try {
    await client.execute(contract, { [method]: { locator: game.locator } }, undefined, [
      {
        amount: '10000000',
        denom: 'uscrt',
      },
    ]);
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === 'ciphertext not set') return;
      if (e.message === 'Request rejected') {
        enqueueSnackbar('Transaction rejected', { variant: 'error' });
        setGame(undefined);
        return;
      }
      if (e.message.includes('Error when posting tx ')) {
        enqueueSnackbar('Error posting transaction', { variant: 'error' });
        setGame(undefined);
        return;
      }
    }
    console.log('playGame error:', e.message);
    enqueueSnackbar('Game creation error', { variant: 'error' });
  }
};

const routeUrl = (
  client: SecretJS.SigningCosmWasmClient | undefined,
  setGame: Function,
  loadGame: Function,
  enqueueSnackbar: Function,
) => {
  const url = new URL(window.location.href);
  const joinLocator = url.searchParams.get('game');
  if (client && joinLocator) {
    setTimeout(() => {
      playGame(client, config.contract, true, setGame, loadGame, enqueueSnackbar, joinLocator);
    }, 500);
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
  } catch (e) {
    setGame((g: Game.Game) => ({ ...g, lastHandsign: undefined }));
    if (e instanceof Error) {
      console.log('playHandsign error:', e.message);
      if (e.message === 'Request rejected') {
        enqueueSnackbar('Transaction rejected', { variant: 'error' });
        throw e;
      }
      if (e.message.includes('Error when posting tx ')) {
        enqueueSnackbar('Error posting transaction', { variant: 'error' });
        throw e;
      }
    }
    enqueueSnackbar('Error playing handsign', { variant: 'error' });
    throw e;
  }
};

const claimInactivity = async (
  client: SecretJS.SigningCosmWasmClient,
  game: Game.Game,
  setGame: Function,
  enqueueSnackbar: Function,
) => {
  try {
    await Game.claimInactivity(client, game);
    setGame(undefined);
  } catch (e) {
    if (e instanceof Error) {
      console.log('claimInactivity error:', e.message);
      if (e.message === 'Request rejected') {
        enqueueSnackbar('Transaction rejected', { variant: 'error' });
        throw e;
      }
      if (e.message.includes('Error when posting tx ')) {
        enqueueSnackbar('Error posting transaction', { variant: 'error' });
        throw e;
      }
    }
    enqueueSnackbar('Error ending game', { variant: 'error' });
    throw e;
  }
};

const leaveGame = async (setGame: Function, loadGame: () => Game.Game | undefined) => {
  const currentGame = loadGame();
  if (currentGame && currentGame.stage !== Game.Stage.Over) {
    setGame(currentGame);
  } else {
    setGame(undefined);
  }
};

export default App;
