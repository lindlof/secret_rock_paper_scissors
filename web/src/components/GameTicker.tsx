import React, { useEffect, useState } from 'react';
import * as SecretJS from 'secretjs';
import * as Game from '../game';

interface Props {
  client: SecretJS.SigningCosmWasmClient;
  game: Game.Game;
  setGame: Function;
}

export default (props: React.PropsWithChildren<Props>) => {
  const { children, client, game, setGame } = props;

  useEffect(() => {
    if (!client || !game) return;
    const timer = setInterval(async () => {
      const updatedGame = await Game.tick(client, game);
      if (updatedGame === undefined) return;
      setGame((g: Game.Game) => {
        console.log('updatedGame', updatedGame);
        const thing = { ...g, ...updatedGame };
        console.log('thing', thing);
        return thing;
      });
    }, 2000);
    return () => clearInterval(timer);
  });

  return <div>{children}</div>;
};
