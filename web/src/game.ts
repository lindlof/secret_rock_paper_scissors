import * as SecretJS from 'secretjs';
import * as Msg from './msg';

interface Game_ {
  readonly contract: string;
  readonly locator: string;
  readonly player1_locator: boolean | undefined;
  readonly stage: Stage;
  readonly round: number;
  readonly won: boolean;
  readonly wins: number;
  readonly losses: number;
  readonly played: boolean;
  readonly opponentPlayed: boolean;
  readonly lastHandsign: Msg.Handsign | undefined;
  readonly winDeadlineSeconds: number | undefined;
  readonly lossDeadlineSeconds: number | undefined;
}

interface GameUpdate_ {
  readonly player1_locator: boolean | undefined;
  readonly stage: Stage;
  readonly round: number;
  readonly won: boolean;
  readonly wins: number;
  readonly losses: number;
  readonly played: boolean;
  readonly opponentPlayed: boolean;
  readonly winDeadlineSeconds: number | undefined;
  readonly lossDeadlineSeconds: number | undefined;
  readonly lastHandsign?: Msg.Handsign | undefined;
}

enum Stage {
  Lobby = 'LOBBY',
  GameOn = 'GAME_ON',
  Over = 'OVER',
}

const create = (contract: string): Game => {
  const locator = new Uint8Array(32);
  crypto.getRandomValues(locator);
  return {
    contract,
    locator: Buffer.from(locator).toString('hex'),
    player1_locator: undefined,
    stage: Stage.Lobby,
    round: 1,
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

const tick = async (
  client: SecretJS.SigningCosmWasmClient,
  game: Game,
): Promise<GameUpdate | undefined> => {
  let gameUpdate: GameUpdate = {
    player1_locator: game.player1_locator,
    stage: game.stage,
    round: game.round,
    won: game.won,
    wins: game.wins,
    losses: game.losses,
    played: game.played,
    opponentPlayed: game.opponentPlayed,
    winDeadlineSeconds: game.winDeadlineSeconds,
    lossDeadlineSeconds: game.lossDeadlineSeconds,
  };
  if (game.stage === Stage.Lobby) {
    const lobby = await client.queryContractSmart(game.contract, {
      game_lobby: { locator: game.locator },
    });
    if (!lobby.game_started) return undefined;
    gameUpdate = {
      ...gameUpdate,
      player1_locator: lobby.player1_locator,
      stage: Stage.GameOn,
    };
  }

  const height = await client.getHeight();
  const status: Msg.GameStatusResponse = await client.queryContractSmart(game.contract, {
    game_status: { locator: game.locator },
  });
  const stage = status.game_over ? Stage.Over : Stage.GameOn;
  const deadlineSeconds = Math.max(0, (status.deadline - height) * 6);

  if (game.player1_locator) {
    gameUpdate = {
      ...gameUpdate,
      stage,
      round: status.round,
      won: status.player1_wins >= 3,
      wins: status.player1_wins,
      losses: status.player2_wins,
      played: status.player1_played,
      opponentPlayed: status.player2_played,
      winDeadlineSeconds:
        status.player1_played && !status.player2_played ? deadlineSeconds : undefined,
      lossDeadlineSeconds:
        !status.player1_played && status.player2_played ? deadlineSeconds : undefined,
    };
  } else {
    gameUpdate = {
      ...gameUpdate,
      stage,
      round: status.round,
      won: status.player2_wins >= 3,
      wins: status.player2_wins,
      losses: status.player1_wins,
      played: status.player2_played,
      opponentPlayed: status.player1_played,
      winDeadlineSeconds:
        !status.player1_played && status.player2_played ? deadlineSeconds : undefined,
      lossDeadlineSeconds:
        status.player1_played && !status.player2_played ? deadlineSeconds : undefined,
    };
  }
  if (gameUpdate.round > game.round) {
    gameUpdate = { ...gameUpdate, lastHandsign: undefined };
  }
  return gameUpdate;
};

const playHandsign = async (
  client: SecretJS.SigningCosmWasmClient,
  game: Game,
  handsign: Msg.Handsign,
) => {
  try {
    await client.execute(game.contract, { play_hand: { handsign, locator: game.locator } });
  } catch (e) {
    if (e.message !== 'ciphertext not set') throw e;
  }
};

const claimInactivity = async (client: SecretJS.SigningCosmWasmClient, game: Game) => {
  try {
    await client.execute(game.contract, { claim_inactivity: { locator: game.locator } });
  } catch (e) {
    if (e.message !== 'ciphertext not set') throw e;
  }
};

export type Game = Game_;
export type GameUpdate = GameUpdate_;
export { Stage, create, tick, playHandsign, claimInactivity };
