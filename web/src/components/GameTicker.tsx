import React, { useEffect } from 'react';
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
        if (g === undefined) return g;
        return { ...g, ...updatedGame };
      });
    }, 2000);
    return () => clearInterval(timer);
  });

  return <div>{children}</div>;
};
