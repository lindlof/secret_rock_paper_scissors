import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';
import Handsign from './components/Handsign';
import * as Msg from './msg';
import * as Game from './game';

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
  },
  paper: {
    padding: theme.spacing(2),
    textAlign: 'center',
    color: theme.palette.text.secondary,
  },
}));

interface Props {
  game: Game.Game;
  playHandsign: Function;
}

export default (props: Props) => {
  const classes = useStyles();
  const { game, playHandsign } = props;

  return (
    <div className={classes.root}>
      <Grid container spacing={3}>
        <Grid item xs={6}>
          <Paper className={classes.paper}>
            <p>Your score {game.wins}</p>
            {game.played ? (
              game.lastHandsign && <Handsign handsign={game.lastHandsign} />
            ) : (
              <Grid container justify="center" alignItems="center">
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
            <p>Opponent score {game.losses}</p>
            <p>{game.opponenPlayed ? 'Opponent played' : 'Waiting for opponent to play'}</p>
          </Paper>
        </Grid>
      </Grid>
    </div>
  );
};
