import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Backdrop from '@material-ui/core/Backdrop';
import { Result, Round } from '../game';

const useStyles = makeStyles((theme) => ({
  backdrop: {
    zIndex: theme.zIndex.drawer + 1,
    color: '#fff',
  },
  content: {
    position: 'absolute',
    width: 270,
    textAlign: 'center',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  },
  text: {
    fontSize: '3rem',
  },
  emoji: {
    fontSize: '5rem',
  },
}));

interface Props {
  round: number;
  rounds: Array<Round | undefined>;
}

const RoundEnd = (props: Props) => {
  const classes = useStyles();
  const { round, rounds } = props;
  const [currentRound, setCurrentRound] = useState<number>(round);
  const [open, setOpen] = useState<boolean>();

  if (round > currentRound) {
    setCurrentRound(round);
    setOpen(true);
    setTimeout(() => {
      setOpen(false);
    }, 3000);
  }

  const lastRound = rounds[round - 2];
  let emoji = '';
  let text = '';
  if (lastRound) {
    switch (lastRound.result) {
      case Result.Won:
        emoji = '🥳';
        text = 'Round won';
        break;
      case Result.Lost:
        emoji = '🥺';
        text = 'Round lost';
        break;
      case Result.Tie:
        emoji = '🙄';
        text = 'Tie';
    }
  }

  return (
    <div>
      {open !== undefined && (
        <Backdrop className={classes.backdrop} open={open}>
          <div className={classes.content}>
            <div className={classes.emoji}>{emoji}</div>
            <div className={classes.text}>{text}</div>
          </div>
        </Backdrop>
      )}
    </div>
  );
};

export default RoundEnd;
