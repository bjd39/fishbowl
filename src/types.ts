export interface GameConfig {
  timerDuration: number;
  passesPerTurn: number; // 0, 1, 2, or Infinity
  slipsPerPlayer: number;
  rounds: RoundConfig[];
}

export interface RoundConfig {
  name: string;
  description: string;
}

export interface Player {
  id: string;
  name: string;
  teamId: string;
}

export interface Slip {
  id: string;
  text: string;
  contributedBy: string;
}

export interface Team {
  id: string;
  name: string;
  playerIds: string[];
  currentPlayerIndex: number;
}

export interface Guess {
  slipId: string;
  clueGiverPlayerId: string;
  teamId: string;
  roundIndex: number;
  timeToGuess: number;
}

export interface TurnGuess extends Guess {}

export interface RoundScore {
  roundIndex: number;
  teamScores: { teamId: string; points: number }[];
  mvpPlayerId: string;
  mvpTurnCount: number;
}

export type GamePhase =
  | 'settings'
  | 'add-players'
  | 'duplicate-check'
  | 'team-assignment'
  | 'turn-order'
  | 'pre-turn'
  | 'active-turn'
  | 'turn-summary'
  | 'round-summary'
  | 'game-over';

export interface GameState {
  config: GameConfig;
  players: Player[];
  teams: Team[];
  allSlips: Slip[];
  currentRoundIndex: number;
  currentTeamIndex: number;
  bowl: string[];
  turnActive: boolean;
  turnSlipId: string | null;
  turnStartTime: number | null;
  slipShownTime: number | null;
  turnPassesRemaining: number;
  turnGuessed: TurnGuess[];
  roundScores: RoundScore[];
  currentRoundGuesses: Guess[];
  phase: GamePhase;
  turnClueGiverId: string | null;
}

export const DEFAULT_ROUNDS: RoundConfig[] = [
  { name: 'Articulate', description: 'Use any words except the name itself. No spelling, no rhymes.' },
  { name: 'One word', description: 'Give a single word clue only.' },
  { name: 'Charades', description: 'Act it out — no sounds allowed!' },
];

export const ROUND_SUGGESTIONS = [
  'Articulate',
  'One word',
  'Charades',
  'Charades under a sheet',
  'One sound',
  'Facial expressions only',
];

export const DEFAULT_CONFIG: GameConfig = {
  timerDuration: 30,
  passesPerTurn: 1,
  slipsPerPlayer: 4,
  rounds: [...DEFAULT_ROUNDS],
};
