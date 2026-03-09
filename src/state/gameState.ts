import { createContext, useContext } from 'react';
import type {
  GameState,
  GameConfig,
  Player,
  Slip,
  Team,
  TurnGuess,
  RoundScore,
  GamePhase,
} from '../types';
import { DEFAULT_CONFIG } from '../types';
import { shuffleArray } from '../utils/shuffle';
import { findDuplicates } from '../utils/dedup';
import { calculateRoundMVP, calculateTeamScores } from '../utils/stats';

export const initialGameState: GameState = {
  config: { ...DEFAULT_CONFIG, rounds: DEFAULT_CONFIG.rounds.map(r => ({ ...r })) },
  players: [],
  teams: [],
  allSlips: [],
  currentRoundIndex: 0,
  currentTeamIndex: 0,
  bowl: [],
  turnActive: false,
  turnSlipId: null,
  turnStartTime: null,
  slipShownTime: null,
  turnPassesRemaining: 0,
  turnGuessed: [],
  roundScores: [],
  currentRoundGuesses: [],
  phase: 'settings',
  turnClueGiverId: null,
};

export type GameAction =
  | { type: 'SET_CONFIG'; config: GameConfig }
  | { type: 'SET_PHASE'; phase: GamePhase }
  | { type: 'ADD_PLAYER'; player: Player; slips: Slip[] }
  | { type: 'REMOVE_PLAYER'; playerId: string }
  | { type: 'RUN_DEDUP' }
  | { type: 'SET_TEAMS'; teams: Team[] }
  | { type: 'UPDATE_TEAM'; team: Team }
  | { type: 'SHUFFLE_TEAMS'; numTeams: number }
  | { type: 'START_ROUND' }
  | { type: 'START_TURN' }
  | { type: 'GOT_IT' }
  | { type: 'PASS_SLIP' }
  | { type: 'FOUL' }
  | { type: 'END_TURN' }
  | { type: 'TIMER_EXPIRED' }
  | { type: 'NEXT_TURN' }
  | { type: 'END_ROUND' }
  | { type: 'SKIP_PLAYER' }
  | { type: 'NEXT_ROUND' }
  | { type: 'PLAY_AGAIN' }
  | { type: 'NEW_GAME' };

function drawSlip(bowl: string[], currentSlipId: string | null): string | null {
  if (bowl.length === 0) return null;
  // Try to draw a different slip than the current one if possible
  if (bowl.length === 1) return bowl[0];
  const available = bowl.filter(id => id !== currentSlipId);
  return available[Math.floor(Math.random() * available.length)];
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_CONFIG':
      return { ...state, config: action.config };

    case 'SET_PHASE':
      return { ...state, phase: action.phase };

    case 'ADD_PLAYER': {
      const existingNames = state.players.map(p => p.name.toLowerCase());
      let name = action.player.name;
      if (existingNames.includes(name.toLowerCase())) {
        name = `${name} (2)`;
      }
      const player = { ...action.player, name };
      return {
        ...state,
        players: [...state.players, player],
        allSlips: [...state.allSlips, ...action.slips],
      };
    }

    case 'REMOVE_PLAYER': {
      return {
        ...state,
        players: state.players.filter(p => p.id !== action.playerId),
        allSlips: state.allSlips.filter(s => s.contributedBy !== action.playerId),
      };
    }

    case 'RUN_DEDUP': {
      const { unique } = findDuplicates(state.allSlips);
      return { ...state, allSlips: unique };
    }

    case 'SET_TEAMS':
      return { ...state, teams: action.teams };

    case 'UPDATE_TEAM':
      return {
        ...state,
        teams: state.teams.map(t => (t.id === action.team.id ? action.team : t)),
      };

    case 'SHUFFLE_TEAMS': {
      const shuffledPlayers = shuffleArray(state.players);
      const numTeams = action.numTeams;
      const teams: Team[] = Array.from({ length: numTeams }, (_, i) => ({
        id: crypto.randomUUID(),
        name: `Team ${i + 1}`,
        playerIds: [],
        currentPlayerIndex: 0,
      }));

      shuffledPlayers.forEach((player, i) => {
        teams[i % numTeams].playerIds.push(player.id);
      });

      const updatedPlayers = state.players.map(p => {
        const team = teams.find(t => t.playerIds.includes(p.id));
        return { ...p, teamId: team?.id || '' };
      });

      return { ...state, teams, players: updatedPlayers };
    }

    case 'START_ROUND': {
      const bowl = shuffleArray(state.allSlips.map(s => s.id));
      return {
        ...state,
        bowl,
        currentRoundGuesses: [],
        phase: 'pre-turn',
      };
    }

    case 'START_TURN': {
      const team = state.teams[state.currentTeamIndex];
      const playerId = team.playerIds[team.currentPlayerIndex];
      const slipId = drawSlip(state.bowl, null);
      return {
        ...state,
        turnActive: true,
        turnSlipId: slipId,
        turnStartTime: performance.now(),
        slipShownTime: performance.now(),
        turnPassesRemaining: state.config.passesPerTurn === Infinity ? Infinity : state.config.passesPerTurn,
        turnGuessed: [],
        turnClueGiverId: playerId,
        phase: 'active-turn',
      };
    }

    case 'GOT_IT': {
      if (!state.turnSlipId || !state.turnClueGiverId) return state;
      const now = performance.now();
      const timeToGuess = now - (state.slipShownTime || now);
      const team = state.teams[state.currentTeamIndex];

      const guess: TurnGuess = {
        slipId: state.turnSlipId,
        clueGiverPlayerId: state.turnClueGiverId,
        teamId: team.id,
        roundIndex: state.currentRoundIndex,
        timeToGuess,
      };

      const newBowl = state.bowl.filter(id => id !== state.turnSlipId);
      const newGuessed = [...state.turnGuessed, guess];
      const newRoundGuesses = [...state.currentRoundGuesses, guess];

      // Bowl empty — round over
      if (newBowl.length === 0) {
        return {
          ...state,
          bowl: newBowl,
          turnGuessed: newGuessed,
          currentRoundGuesses: newRoundGuesses,
          turnSlipId: null,
          turnActive: false,
          phase: 'turn-summary',
        };
      }

      // Draw next slip
      const nextSlip = drawSlip(newBowl, null);
      return {
        ...state,
        bowl: newBowl,
        turnGuessed: newGuessed,
        currentRoundGuesses: newRoundGuesses,
        turnSlipId: nextSlip,
        slipShownTime: performance.now(),
      };
    }

    case 'PASS_SLIP': {
      if (!state.turnSlipId) return state;
      // Single slip in bowl — can't pass
      if (state.bowl.length <= 1) return state;
      if (state.turnPassesRemaining <= 0) return state;

      const nextSlip = drawSlip(state.bowl, state.turnSlipId);
      return {
        ...state,
        turnSlipId: nextSlip,
        slipShownTime: performance.now(),
        turnPassesRemaining: state.turnPassesRemaining - 1,
      };
    }

    case 'FOUL': {
      if (!state.turnSlipId) return state;
      // Slip goes back to bowl, draw another (or same if only one)
      const nextSlip = drawSlip(state.bowl, state.turnSlipId);
      return {
        ...state,
        turnSlipId: nextSlip || state.turnSlipId,
        slipShownTime: performance.now(),
      };
    }

    case 'END_TURN':
    case 'TIMER_EXPIRED': {
      // Current slip (if any) stays in bowl
      return {
        ...state,
        turnActive: false,
        turnSlipId: null,
        phase: 'turn-summary',
      };
    }

    case 'NEXT_TURN': {
      // Advance to next team and player
      const nextTeamIndex = (state.currentTeamIndex + 1) % state.teams.length;
      const advancedTeams = state.teams.map((t, i) => {
        if (i === state.currentTeamIndex) {
          return {
            ...t,
            currentPlayerIndex: (t.currentPlayerIndex + 1) % t.playerIds.length,
          };
        }
        return t;
      });

      return {
        ...state,
        teams: advancedTeams,
        currentTeamIndex: nextTeamIndex,
        phase: 'pre-turn',
      };
    }

    case 'SKIP_PLAYER': {
      // Current team's current player gets pushed back, next player goes
      const team = state.teams[state.currentTeamIndex];
      if (team.playerIds.length <= 1) return state;

      // Advance the current player index (effectively skipping current)
      const advancedTeams = state.teams.map((t, i) => {
        if (i === state.currentTeamIndex) {
          return {
            ...t,
            currentPlayerIndex: (t.currentPlayerIndex + 1) % t.playerIds.length,
          };
        }
        return t;
      });

      return { ...state, teams: advancedTeams };
    }

    case 'END_ROUND': {
      const teamScores = calculateTeamScores(
        state.currentRoundGuesses,
        state.currentRoundIndex,
        state.teams,
      );
      const { mvpPlayerId, mvpTurnCount } = calculateRoundMVP(
        state.currentRoundGuesses,
        state.currentRoundIndex,
        state.players,
      );

      const roundScore: RoundScore = {
        roundIndex: state.currentRoundIndex,
        teamScores,
        mvpPlayerId,
        mvpTurnCount,
      };

      const newRoundScores = [...state.roundScores, roundScore];
      const isLastRound = state.currentRoundIndex >= state.config.rounds.length - 1;

      return {
        ...state,
        roundScores: newRoundScores,
        phase: isLastRound ? 'game-over' : 'round-summary',
      };
    }

    case 'NEXT_ROUND': {
      const nextRoundIndex = state.currentRoundIndex + 1;
      if (nextRoundIndex >= state.config.rounds.length) return state;
      const bowl = shuffleArray(state.allSlips.map(s => s.id));
      return {
        ...state,
        currentRoundIndex: nextRoundIndex,
        bowl,
        currentRoundGuesses: [],
        phase: 'pre-turn',
      };
    }

    case 'PLAY_AGAIN': {
      return {
        ...initialGameState,
        config: { ...state.config },
        players: state.players.map(p => ({ ...p })),
        allSlips: state.allSlips.map(s => ({ ...s })),
        teams: state.teams.map(t => ({ ...t, currentPlayerIndex: 0 })),
        phase: 'pre-turn',
        currentRoundIndex: 0,
        currentTeamIndex: 0,
        bowl: shuffleArray(state.allSlips.map(s => s.id)),
      };
    }

    case 'NEW_GAME':
      return { ...initialGameState };

    default:
      return state;
  }
}

export const GameContext = createContext<{
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}>({
  state: initialGameState,
  dispatch: () => {},
});

export function useGame() {
  return useContext(GameContext);
}
