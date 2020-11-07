import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import mascot from './image/stone-giant.svg';

const useStyles = makeStyles((theme) => ({
  root: {
    maxWidth: '20em',
  },
  secret: {
    textAlign: 'center',
    letterSpacing: '1rem',
  },
  rps: {
    textAlign: 'center',
    wordSpacing: 99999,
  },
}));

export default () => {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <Typography variant="h2" color="textPrimary" className={classes.secret}>
        S·E·C·R·E·T
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={7}>
          <Typography variant="h4" color="textPrimary" className={classes.rps}>
            Rock Paper Scissors
          </Typography>
        </Grid>
        <Grid item xs={5}>
          <img src={mascot} alt={'mascot'} />
        </Grid>
      </Grid>
    </div>
  );
};
