import * as SecretJS from 'secretjs';
import * as Msg from './msg';

interface Game_ {
  readonly contract: string;
  readonly creator: boolean;
  readonly status: Status;
  readonly wins: number;
  readonly losses: number;
  readonly played: boolean;
  readonly opponenPlayed: boolean;
  readonly lastHandsign: Msg.Handsign | undefined;
}

enum Status {
  NOT_STARTED,
  GAME_ON,
  ENDED,
}

const create = (contract: string, creator: boolean): Game => {
  return {
    contract,
    creator,
    status: Status.NOT_STARTED,
    wins: 0,
    losses: 0,
    played: false,
    opponenPlayed: false,
    lastHandsign: undefined,
  };
};

const tick = async (client: SecretJS.SigningCosmWasmClient, game: Game): Promise<Game> => {
  if (game.status === Status.NOT_STARTED) {
    const lobby = await client.queryContractSmart(game.contract, { game_lobby: {} });
    if (!lobby.player2_joined) return game;
    return { ...game, status: Status.GAME_ON };
  }

  const status = await client.queryContractSmart(game.contract, { game_status: {} });

  if (game.creator) {
    return {
      ...game,
      wins: status.player1_wins,
      losses: status.player2_wins,
      played: status.player1_played,
      lastHandsign: status.player1_played ? game.lastHandsign : undefined,
      opponenPlayed: status.player2_played,
    };
  } else {
    return {
      ...game,
      wins: status.player2_wins,
      losses: status.player1_wins,
      played: status.player2_played,
      lastHandsign: status.player2_played ? game.lastHandsign : undefined,
      opponenPlayed: status.player1_played,
    };
  }
};

const playHandsign = async (
  client: SecretJS.SigningCosmWasmClient,
  game: Game,
  handsign: Msg.Handsign,
) => {
  await client.execute(game.contract, { play_hand: { handsign } });
  return {
    ...game,
    lastHandsign: handsign,
  };
};

export type Game = Game_;
export { Status, create, tick, playHandsign };
