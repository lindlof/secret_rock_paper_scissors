import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';
import { Button } from '@material-ui/core';
import Handsign from './components/Handsign';
import * as Msg from './msg';
import * as Game from './game';
import ScoreStar from './components/ScoreStar';
import CircularProgress from '@material-ui/core/CircularProgress';

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
}));

interface Props {
  game: Game.Game;
  playHandsign: Function;
  leaveGame: Function;
  claimInactivity: () => Promise<void>;
}

enum DisplayContent {
  PickHandsign,
  SelectedHandsign,
  Loading,
  Ending,
}

export default (props: Props) => {
  const classes = useStyles();
  const { game, playHandsign, leaveGame, claimInactivity } = props;
  const [pickedRound, setPickedRound] = useState<number>();
  const [claimingInactivity, setClaimingInactivity] = useState<boolean>(false);
  const pickHandsign = (handsign: Msg.Handsign) => {
    setPickedRound(game.round);
    playHandsign(handsign);
  };
  const tryClaimInactivity = async () => {
    setClaimingInactivity(true);
    try {
      await claimInactivity();
    } catch {
      setClaimingInactivity(false);
    }
  };

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

  return (
    <div className={classes.root}>
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
              <Handsign handsign={game.lastHandsign} />
            )}
            {displayContent === DisplayContent.Ending && <p>You {game.won ? 'won' : 'lost'}</p>}
            {displayContent === DisplayContent.PickHandsign && (
              <div>
                <Grid container justify="center" alignItems="center" spacing={3}>
                  <Grid item sm={4}>
                    <Handsign
                      handsign={Msg.Handsign.Rock}
                      onClick={() => pickHandsign(Msg.Handsign.Rock)}
                    />
                  </Grid>
                  <Grid item sm={4}>
                    <Handsign
                      handsign={Msg.Handsign.Paper}
                      onClick={() => pickHandsign(Msg.Handsign.Paper)}
                    />
                  </Grid>
                  <Grid item sm={4}>
                    <Handsign
                      handsign={Msg.Handsign.Scissors}
                      onClick={() => pickHandsign(Msg.Handsign.Scissors)}
                    />
                  </Grid>
                </Grid>
                {game.lossDeadlineSeconds !== undefined && game.lossDeadlineSeconds > 0 && (
                  <p>You have {game.lossDeadlineSeconds}s</p>
                )}
                {game.lossDeadlineSeconds !== undefined && game.lossDeadlineSeconds === 0 && (
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
      <div className={classes.leave}>
        <Button variant="contained" color="primary" onClick={() => leaveGame()}>
          Leave game
        </Button>
      </div>
    </div>
  );
};
