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
    letterSpacing: '2rem',
  },
  rps: {
    textAlign: 'center',
    wordSpacing: 99999,
  },
}));

const Banner = () => {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <Grid container>
        <Grid item xs={12}>
          <Typography variant="h4" color="textPrimary" className={classes.secret}>
            SECRET
          </Typography>
        </Grid>
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
export default Banner;
