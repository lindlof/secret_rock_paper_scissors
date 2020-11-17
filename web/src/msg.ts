export interface GameLobbyResponse {
  player2_joined: boolean;
}

export interface GameStatusResponse {
  round: number;
  player1_played: boolean;
  player2_played: boolean;
  player1_wins: number;
  player2_wins: number;
  deadline: number;
  game_over: boolean;
}

export enum Handsign {
  Rock = 'ROCK',
  Paper = 'PAPR',
  Scissors = 'SCRS',
}
