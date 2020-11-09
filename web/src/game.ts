import * as SecretJS from 'secretjs';
import * as Msg from './msg';

interface Game_ {
  readonly contract: string;
  readonly creator: boolean;
  readonly stage: Stage;
  readonly won: boolean;
  readonly wins: number;
  readonly losses: number;
  readonly played: boolean;
  readonly opponentPlayed: boolean;
  readonly lastHandsign: Msg.Handsign | undefined;
  readonly winDeadlineSeconds: number | undefined;
  readonly lossDeadlineSeconds: number | undefined;
}

enum Stage {
  Lobby = 'LOBBY',
  GameOn = 'GAME_ON',
  Over = 'OVER',
}

const create = (contract: string, creator: boolean): Game => {
  return {
    contract,
    creator,
    stage: Stage.Lobby,
    won: false,
    wins: 0,
    losses: 0,
    played: false,
    opponentPlayed: false,
    lastHandsign: undefined,
    winDeadlineSeconds: undefined,
    lossDeadlineSeconds: undefined,
  };
};

const tick = async (client: SecretJS.SigningCosmWasmClient, game: Game): Promise<Game> => {
  if (game.stage === Stage.Lobby) {
    const lobby = await client.queryContractSmart(game.contract, { game_lobby: {} });
    if (!lobby.player2_joined) return game;
    return { ...game, stage: Stage.GameOn };
  }

  const height = await client.getHeight();
  const status: Msg.GameStatusResponse = await client.queryContractSmart(game.contract, {
    game_status: {},
  });
  const stage = status.game_over ? Stage.Over : Stage.GameOn;
  const deadlineSeconds = Math.max(0, (status.deadline - height) * 6);

  if (game.creator) {
    return {
      ...game,
      stage,
      won: status.player1_wins >= 3,
      wins: status.player1_wins,
      losses: status.player2_wins,
      played: status.player1_played,
      lastHandsign: status.player1_played ? game.lastHandsign : undefined,
      opponentPlayed: status.player2_played,
      winDeadlineSeconds:
        status.player1_played && !status.player2_played ? deadlineSeconds : undefined,
      lossDeadlineSeconds:
        !status.player1_played && status.player2_played ? deadlineSeconds : undefined,
    };
  } else {
    return {
      ...game,
      stage,
      won: status.player2_wins >= 3,
      wins: status.player2_wins,
      losses: status.player1_wins,
      played: status.player2_played,
      lastHandsign: status.player2_played ? game.lastHandsign : undefined,
      opponentPlayed: status.player1_played,
      winDeadlineSeconds:
        !status.player1_played && status.player2_played ? deadlineSeconds : undefined,
      lossDeadlineSeconds:
        status.player1_played && !status.player2_played ? deadlineSeconds : undefined,
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

const claimInactivity = async (client: SecretJS.SigningCosmWasmClient, game: Game) => {
  await client.execute(game.contract, { claim_inactivity: {} });
};

export type Game = Game_;
export { Stage, create, tick, playHandsign, claimInactivity };
