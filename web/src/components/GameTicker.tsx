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
      if (game.stage === Game.Stage.Over) return;
      let update: Game.TickUpdate | undefined;
      try {
        update = await Game.tick(client, game);
      } catch {}
      if (update === undefined) return;
      setGame((g: Game.Game | undefined): Game.Game | undefined => {
        if (g === undefined || !update) return;
        if (g.locator !== game.locator) return;
        return { ...g, ...update };
      });
    }, 2000);
    return () => clearInterval(timer);
  });

  return <div>{children}</div>;
};

export default GameTicker;
