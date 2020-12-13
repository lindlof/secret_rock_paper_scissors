import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';
import { Button, Typography, Container } from '@material-ui/core';
import Box from '@material-ui/core/Box';
import HandsignImg from './components/HandsignImg';
import * as Msg from './msg';
import * as Game from './game';
import ScoreStar from './components/ScoreStar';
import CircularProgress from '@material-ui/core/CircularProgress';
import RoundEnd from './components/RoundEnd';

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
  },
  paper: {
    padding: theme.spacing(2),
    textAlign: 'center',
    color: theme.palette.text.secondary,
  },
  star: {
    paddingLeft: '0.5em',
    paddingRight: '0.5em',
  },
  stars: {
    paddingBottom: '0.7em',
  },
  round: {
    textAlign: 'center',
  },
  leave: {
    textAlign: 'right',
    margin: '1em',
  },
  url: {
    wordWrap: 'break-word',
    wordBreak: 'break-all',
    height: '100%',
  },
}));

interface Props {
  game: Game.Game;
  playHandsign: (handsign: Msg.Handsign) => Promise<void>;
  leaveGame: Function;
  claimInactivity: () => Promise<void>;
  enqueueSnackbar: Function;
}

enum DisplayContent {
  PickHandsign,
  SelectedHandsign,
  Loading,
  Ending,
}

const GamePlaying = (props: Props) => {
  const classes = useStyles();
  const { game, playHandsign, leaveGame, claimInactivity, enqueueSnackbar } = props;
  const [pickedRound, setPickedRound] = useState<number>();
  const [claimingInactivity, setClaimingInactivity] = useState<boolean>(false);
  const pickHandsign = async (handsign: Msg.Handsign) => {
    setPickedRound(game.round);
    try {
      await playHandsign(handsign);
    } catch {
      setPickedRound(undefined);
    }
  };
  const tryClaimInactivity = async () => {
    setClaimingInactivity(true);
    try {
      await claimInactivity();
    } catch {
      setClaimingInactivity(false);
    }
  };

  if (game.stage === Game.Stage.Creating) {
    const now = Number(new Date());
    return (
      <div>
        <CircularProgress />
        {now > game.createdAt + 10 * 1000 && (
          <div>
            <Typography>
              This is taking a while. You can abandon if your entry transaction doesn't go through.
            </Typography>
            <Typography>
              Otherwise, abandoning results in loss of your entry funds (10 SCRT).
            </Typography>
            <Button
              variant="contained"
              color="secondary"
              disabled={now < game.createdAt + 13 * 1000}
              onClick={() => leaveGame()}
            >
              DANGER: Abandon game
            </Button>
          </div>
        )}
      </div>
    );
  }

  let displayContent: DisplayContent = DisplayContent.PickHandsign;
  if (pickedRound === game.round) {
    displayContent = DisplayContent.Loading;
  }
  if (game.played) {
    displayContent = DisplayContent.SelectedHandsign;
  }
  if (game.stage === Game.Stage.Over) {
    displayContent = DisplayContent.Ending;
  }

  if (game.stage === Game.Stage.Lobby) {
    const query = new URLSearchParams();
    query.append('game', game.locator);
    const url = `${document.location.origin}?${query.toString()}`;
    return (
      <Container fixed maxWidth="sm">
        <Grid container spacing={4}>
          {game.privateGame && (
            <Grid item>
              <Typography>Send this link to your friend</Typography>

              <Grid container>
                <Grid item sm={9} xs={12}>
                  <Box bgcolor="primary.main" color="primary.contrastText" p={1}>
                    <Typography className={classes.url}>{url}</Typography>
                  </Box>
                </Grid>
                <Grid item sm={3} xs={12}>
                  <Button
                    variant="contained"
                    color="secondary"
                    component="div"
                    fullWidth
                    className={classes.url}
                    onClick={() => {
                      navigator.clipboard.writeText(url);
                      enqueueSnackbar('Join link copied to clipboard', { variant: 'success' });
                    }}
                  >
                    Copy
                  </Button>
                </Grid>
              </Grid>
            </Grid>
          )}
          <Grid item>
            <Typography>Waiting for other player</Typography>
            {claimingInactivity ? (
              <CircularProgress />
            ) : (
              <Button variant="contained" color="primary" onClick={tryClaimInactivity}>
                Cancel game
              </Button>
            )}
          </Grid>
        </Grid>
      </Container>
    );
  }

  return (
    <div className={classes.root}>
      <RoundEnd round={game.round} rounds={game.rounds} />
      <h2 className={classes.round}>
        Round {game.stage === Game.Stage.Over ? game.round - 1 : game.round}
      </h2>
      <Grid container spacing={3}>
        <Grid item xs={6}>
          <Paper className={classes.paper}>
            <div className={classes.stars}>
              <ScoreStar pos={0} score={game.wins} className={classes.star} />
              <ScoreStar pos={1} score={game.wins} className={classes.star} />
              <ScoreStar pos={2} score={game.wins} className={classes.star} />
            </div>

            {displayContent === DisplayContent.Loading && <CircularProgress />}
            {displayContent === DisplayContent.SelectedHandsign && game.lastHandsign && (
              <HandsignImg handsign={game.lastHandsign} />
            )}
            {displayContent === DisplayContent.Ending && <p>You {game.won ? 'won' : 'lost'}</p>}
            {displayContent === DisplayContent.PickHandsign && (
              <div>
                <Grid container justify="center" alignItems="center" spacing={3}>
                  <Grid item sm={4}>
                    <HandsignImg
                      handsign={Msg.Handsign.Rock}
                      onClick={() => pickHandsign(Msg.Handsign.Rock)}
                    />
                  </Grid>
                  <Grid item sm={4}>
                    <HandsignImg
                      handsign={Msg.Handsign.Paper}
                      onClick={() => pickHandsign(Msg.Handsign.Paper)}
                    />
                  </Grid>
                  <Grid item sm={4}>
                    <HandsignImg
                      handsign={Msg.Handsign.Scissors}
                      onClick={() => pickHandsign(Msg.Handsign.Scissors)}
                    />
                  </Grid>
                </Grid>
                {game.lossDeadlineSeconds !== undefined && game.lossDeadlineSeconds > 0 && (
                  <p>You have {game.lossDeadlineSeconds}s</p>
                )}
                {game.lossDeadlineSeconds === 0 && (
                  <p>Play before opponent claims victory for inactivity</p>
                )}
              </div>
            )}
          </Paper>
        </Grid>
        <Grid item xs={6}>
          <Paper className={classes.paper}>
            <div className={classes.stars}>
              <ScoreStar pos={0} score={game.losses} className={classes.star} />
              <ScoreStar pos={1} score={game.losses} className={classes.star} />
              <ScoreStar pos={2} score={game.losses} className={classes.star} />
            </div>
            {game.stage === Game.Stage.Over && <p>Game over</p>}
            {game.stage === Game.Stage.GameOn &&
              (game.opponentPlayed ? <p>Opponent played</p> : <p>Waiting for opponent to play</p>)}
            {game.winDeadlineSeconds !== undefined && game.winDeadlineSeconds > 0 && (
              <p>They have {game.winDeadlineSeconds}s</p>
            )}
            {game.winDeadlineSeconds !== undefined &&
              game.winDeadlineSeconds === 0 &&
              (claimingInactivity ? (
                <CircularProgress />
              ) : (
                <Button variant="contained" color="primary" onClick={tryClaimInactivity}>
                  Claim victory for inactivity
                </Button>
              ))}
          </Paper>
        </Grid>
      </Grid>
      {game.stage === Game.Stage.Over && (
        <div className={classes.leave}>
          <Button variant="contained" color="primary" onClick={() => leaveGame()}>
            Leave game
          </Button>
        </div>
      )}
    </div>
  );
};

export default GamePlaying;
