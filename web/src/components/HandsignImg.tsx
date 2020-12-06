import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import * as Msg from '../msg';
import rockImg from '../image/rock.svg';
import paperImg from '../image/paper.svg';
import scissorsImg from '../image/scissors.svg';

const useStyles = makeStyles((theme) => ({
  handsignDiv: {
    display: 'flex',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  handsignImg: {
    width: '80%',
  },
  clickable: {
    cursor: 'pointer',
  },
}));

interface Props {
  handsign: Msg.Handsign;
  onClick?: Function;
}

const HandsignImg = (props: Props) => {
  const classes = useStyles();
  let handsignImg = classes.handsignImg;
  if (props.onClick) {
    handsignImg = clsx(classes.handsignImg, classes.clickable);
  }

  let img;
  switch (props.handsign) {
    case Msg.Handsign.Rock:
      img = rockImg;
      break;
    case Msg.Handsign.Paper:
      img = paperImg;
      break;
    case Msg.Handsign.Scissors:
      img = scissorsImg;
  }

  return (
    <div className={classes.handsignDiv}>
      <img
        src={img}
        alt={props.handsign.toString()}
        className={handsignImg}
        onClick={() => props.onClick && props.onClick()}
      />
    </div>
  );
};

export default HandsignImg;
