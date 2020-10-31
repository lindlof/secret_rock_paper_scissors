import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Button } from '@material-ui/core';
import Paper from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';
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
            {!game.played && (
              <div>
                <Button variant="contained" color="primary" onClick={() => playHandsign('ROCK')}>
                  Rock
                </Button>
                <Button variant="contained" color="primary" onClick={() => playHandsign('PAPER')}>
                  Paper
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => playHandsign('SCISSORS')}
                >
                  Scissors
                </Button>
              </div>
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
