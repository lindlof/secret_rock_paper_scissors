import React, { useEffect } from 'react';
import * as SecretJS from 'secretjs';
import * as Game from '../game';

interface Props {
  client: SecretJS.SigningCosmWasmClient;
  game: Game.Game;
  setGame: Function;
}

const GameTicker = (props: React.PropsWithChildren<Props>) => {
  const { children, client, game, setGame } = props;

  useEffect(() => {
    if (!client || !game) return;
    const timer = setInterval(async () => {
      let update: Game.TickUpdate | undefined;
      try {
        update = await Game.tick(client, game);
      } catch {}
      if (update === undefined) return;
      setGame((g: Game.Game): Game.Game | undefined => {
        if (!update) return;
        return { ...g, ...update };
      });
    }, 2000);
    return () => clearInterval(timer);
  });

  return <div>{children}</div>;
};

export default GameTicker;
