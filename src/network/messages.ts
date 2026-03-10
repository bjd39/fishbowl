// === Connection status ===

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'error';

// === Device tracking ===

export interface Device {
  id: string;
  peerId: string;
  playerIds: string[];
  connected: boolean;
  lastSeen: number;
}

// === Player Device -> Host ===

export interface PlayerSubmitMessage {
  type: 'player_submit';
  playerName: string;
  slips: string[];
}

export interface TurnResultMessage {
  type: 'turn_result';
  playerId: string;
  guessed: { slipId: string; timeToGuess: number }[];
  fouls: string[];
  passed: string[];
  endReason: 'timer' | 'voluntary' | 'bowl_empty';
}

export interface PlayerReadyMessage {
  type: 'player_ready';
  playerId: string;
}

export interface HeartbeatMessage {
  type: 'heartbeat';
  timerRemaining: number;
}

// === Host -> Player Devices ===

export interface GameStateMessage {
  type: 'game_state';
  state: BroadcastGameState;
}

export interface TurnAssignmentMessage {
  type: 'turn_assignment';
  playerId: string;
  bowl: { id: string; text: string }[];
  timerDuration: number;
  passesAllowed: number;
  roundName: string;
  roundDescription: string;
}

export interface PlayerAcceptedMessage {
  type: 'player_accepted';
  player: { id: string; name: string; slipCount: number };
}

export interface PlayerRejectedMessage {
  type: 'player_rejected';
  reason: string;
}

// === Broadcast game state (sent to all devices) ===

export interface BroadcastGameState {
  phase: 'lobby' | 'playing' | 'turn-summary' | 'round-summary' | 'game-over';
  teams: {
    id: string;
    name: string;
    players: { id: string; name: string }[];
    score: number;
  }[];
  currentRound: { index: number; name: string; description: string } | null;
  slipsRemaining: number;
  currentTurn: {
    playerId: string;
    playerName: string;
    teamName: string;
    deviceId: string;
  } | null;
  turnSummary: {
    playerName: string;
    teamName: string;
    slipsGuessed: string[];
    count: number;
  } | null;
  roundSummary: {
    roundName: string;
    teamScores: { teamName: string; roundPoints: number; totalPoints: number }[];
    mvp: { playerName: string; count: number };
  } | null;
  gameOver: {
    winningTeam: string;
    finalScores: { teamName: string; points: number }[];
  } | null;
}

// === Union types for message routing ===

export type PlayerToHostMessage =
  | PlayerSubmitMessage
  | TurnResultMessage
  | PlayerReadyMessage
  | HeartbeatMessage;

export type HostToPlayerMessage =
  | GameStateMessage
  | TurnAssignmentMessage
  | PlayerAcceptedMessage
  | PlayerRejectedMessage;

export type NetworkMessage = PlayerToHostMessage | HostToPlayerMessage;

// === Helpers ===

export function isPlayerToHostMessage(msg: unknown): msg is PlayerToHostMessage {
  if (typeof msg !== 'object' || msg === null || !('type' in msg)) return false;
  const type = (msg as { type: string }).type;
  return ['player_submit', 'turn_result', 'player_ready', 'heartbeat'].includes(type);
}

export function isHostToPlayerMessage(msg: unknown): msg is HostToPlayerMessage {
  if (typeof msg !== 'object' || msg === null || !('type' in msg)) return false;
  const type = (msg as { type: string }).type;
  return ['game_state', 'turn_assignment', 'player_accepted', 'player_rejected'].includes(type);
}
