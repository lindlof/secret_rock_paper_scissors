import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';
import Handsign from './components/Handsign';
import * as Msg from './msg';
import * as Game from './game';
import ScoreStar from './components/ScoreStar';

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
}));

interface Props {
  game: Game.Game;
  playHandsign: Function;
}

enum DisplayContent {
  PickHandsign,
  SelectedHandsign,
  Ending,
}

export default (props: Props) => {
  const classes = useStyles();
  const { game, playHandsign } = props;

  let displayContent: DisplayContent = DisplayContent.PickHandsign;
  if (game.played) {
    displayContent = DisplayContent.SelectedHandsign;
  }
  if (game.stage === Game.Stage.ENDED) {
    displayContent = DisplayContent.Ending;
  }

  return (
    <div className={classes.root}>
      <Grid container spacing={3}>
        <Grid item xs={6}>
          <Paper className={classes.paper}>
            <div className={classes.stars}>
              <ScoreStar pos={0} score={game.wins} className={classes.star} />
              <ScoreStar pos={1} score={game.wins} className={classes.star} />
              <ScoreStar pos={2} score={game.wins} className={classes.star} />
            </div>

            {displayContent === DisplayContent.SelectedHandsign && game.lastHandsign && (
              <Handsign handsign={game.lastHandsign} />
            )}
            {displayContent === DisplayContent.Ending && <p>You {game.won ? 'won' : 'lost'}</p>}
            {displayContent === DisplayContent.PickHandsign && (
              <Grid container justify="center" alignItems="center" spacing={3}>
                <Grid item sm={4}>
                  <Handsign
                    handsign={Msg.Handsign.Rock}
                    onClick={() => playHandsign(Msg.Handsign.Rock)}
                  />
                </Grid>
                <Grid item sm={4}>
                  <Handsign
                    handsign={Msg.Handsign.Paper}
                    onClick={() => playHandsign(Msg.Handsign.Paper)}
                  />
                </Grid>
                <Grid item sm={4}>
                  <Handsign
                    handsign={Msg.Handsign.Scissors}
                    onClick={() => playHandsign(Msg.Handsign.Scissors)}
                  />
                </Grid>
              </Grid>
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
            {game.stage === Game.Stage.ENDED && <p>Game over</p>}
            {game.stage === Game.Stage.GAME_ON &&
              (game.opponentPlayed ? <p>Opponent played</p> : <p>Waiting for opponent to play</p>)}
          </Paper>
        </Grid>
      </Grid>
    </div>
  );
};
