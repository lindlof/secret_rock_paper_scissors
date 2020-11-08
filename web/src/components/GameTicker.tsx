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
  const [tickGame, setTickGame] = useState<Game.Game | undefined>();

  useEffect(() => {
    if (!client || !game) return;
    const timer = setInterval(async () => {
      const updatedGame = await Game.tick(client, game);
      if (game) {
        setTickGame(updatedGame);
      }
    }, 2000);
    return () => clearInterval(timer);
  });
  useEffect(() => {
    if (!game || !tickGame) return;
    setGame(tickGame);
  }, [tickGame]);

  return <div>{children}</div>;
};
