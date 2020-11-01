export interface GameLobbyResponse {
  player2_joined: boolean;
}

export interface GameStatusResponse {
  player1_played: boolean;
  player2_played: boolean;
  player1_wins: number;
  player2_wins: number;
}

export enum Handsign {
  Rock = 'ROCK',
  Paper = 'PAPER',
  Scissors = 'SCISSORS',
}
