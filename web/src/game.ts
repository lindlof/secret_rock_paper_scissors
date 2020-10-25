import * as SecretJS from 'secretjs';

interface Game_ {
  readonly contract: string;
  readonly creator: boolean;
  readonly status: Status;
  readonly wins: number;
  readonly losses: number;
  readonly played: boolean;
  readonly opponenPlayed: boolean;
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
  };
};

const tick = async (client: SecretJS.SigningCosmWasmClient, game: Game): Promise<Game> => {
  if (game.status === Status.NOT_STARTED) {
    const lobby = await client.queryContractSmart(game.contract, { game_lobby: {} });
    if (!lobby.player2_joined) return game;
    return { ...game, status: Status.GAME_ON };
  }

  const status = await client.queryContractSmart(game.contract, { game_status: {} });

  return {
    ...game,
    wins: game.creator ? status.player1_wins : status.player2_wins,
    losses: game.creator ? status.player2_wins : status.player1_wins,
    played: game.creator ? status.player1_played : status.player2_played,
    opponenPlayed: game.creator ? status.player2_played : status.player1_played,
  };
};

export type Game = Game_;
export { Status, create, tick };
