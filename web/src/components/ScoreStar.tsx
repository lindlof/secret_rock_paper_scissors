import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import starBlank from '../image/star-blank.svg';
import starGold from '../image/star-gold.svg';

interface Props {
  pos: number;
  score: number;
  className?: string;
}

const useStyles = makeStyles((theme) => ({
  star: {
    maxWidth: '2em',
  },
}));

const ScoreStar = (props: Props) => {
  const classes = useStyles();
  const { pos, score, className } = props;
  const cls = clsx(className, classes.star);

  return <img src={pos < score ? starGold : starBlank} alt={'star blank'} className={cls} />;
};

export default ScoreStar;
