import type { GameState } from '../types';
import type { BroadcastGameState } from './messages';

/** Converts host GameState to a BroadcastGameState safe to send to all devices */
export function toBroadcastState(state: GameState): BroadcastGameState {
  // Map host phase to broadcast phase
  let phase: BroadcastGameState['phase'];
  switch (state.phase) {
    case 'settings':
    case 'add-players':
    case 'duplicate-check':
    case 'team-assignment':
    case 'turn-order':
      phase = 'lobby';
      break;
    case 'pre-turn':
    case 'active-turn':
      phase = 'playing';
      break;
    case 'turn-summary':
      phase = 'turn-summary';
      break;
    case 'round-summary':
      phase = 'round-summary';
      break;
    case 'game-over':
      phase = 'game-over';
      break;
    default:
      phase = 'lobby';
  }

  // Calculate team scores (cumulative across all rounds + current)
  const teams = state.teams.map((team) => {
    let score = 0;
    for (const rs of state.roundScores) {
      const ts = rs.teamScores.find((s) => s.teamId === team.id);
      score += ts?.points || 0;
    }
    for (const g of state.currentRoundGuesses) {
      if (g.teamId === team.id) score++;
    }

    return {
      id: team.id,
      name: team.name,
      players: team.playerIds
        .map((pid) => state.players.find((p) => p.id === pid))
        .filter(Boolean)
        .map((p) => ({ id: p!.id, name: p!.name })),
      score,
    };
  });

  // Current round info
  const round = state.config.rounds[state.currentRoundIndex];
  const currentRound = round
    ? { index: state.currentRoundIndex, name: round.name, description: round.description }
    : null;

  // Current turn info
  let currentTurn: BroadcastGameState['currentTurn'] = null;
  if (state.phase === 'pre-turn' || state.phase === 'active-turn') {
    const team = state.teams[state.currentTeamIndex];
    const playerId = team?.playerIds[team.currentPlayerIndex];
    const player = state.players.find((p) => p.id === playerId);
    if (player && team) {
      currentTurn = {
        playerId: player.id,
        playerName: player.name,
        teamName: team.name,
        deviceId: player.deviceId,
      };
    }
  }

  // Turn summary (after a turn ends)
  let turnSummary: BroadcastGameState['turnSummary'] = null;
  if (state.phase === 'turn-summary' && state.turnClueGiverId) {
    const player = state.players.find((p) => p.id === state.turnClueGiverId);
    const team = state.teams.find((t) => t.playerIds.includes(state.turnClueGiverId!));
    const guessedSlipTexts = state.turnGuessed.map((g) => {
      const slip = state.allSlips.find((s) => s.id === g.slipId);
      return slip?.text || 'Unknown';
    });
    if (player && team) {
      turnSummary = {
        playerName: player.name,
        teamName: team.name,
        slipsGuessed: guessedSlipTexts,
        count: guessedSlipTexts.length,
      };
    }
  }

  // Round summary
  let roundSummary: BroadcastGameState['roundSummary'] = null;
  if (state.phase === 'round-summary' && state.roundScores.length > 0) {
    const latestRound = state.roundScores[state.roundScores.length - 1];
    const roundConfig = state.config.rounds[latestRound.roundIndex];
    const mvpPlayer = state.players.find((p) => p.id === latestRound.mvpPlayerId);

    roundSummary = {
      roundName: roundConfig?.name || `Round ${latestRound.roundIndex + 1}`,
      teamScores: latestRound.teamScores.map((ts) => {
        const team = state.teams.find((t) => t.id === ts.teamId);
        // Calculate cumulative total for this team
        let totalPoints = 0;
        for (const rs of state.roundScores) {
          const s = rs.teamScores.find((x) => x.teamId === ts.teamId);
          totalPoints += s?.points || 0;
        }
        return {
          teamName: team?.name || 'Unknown',
          roundPoints: ts.points,
          totalPoints,
        };
      }),
      mvp: {
        playerName: mvpPlayer?.name || 'Unknown',
        count: latestRound.mvpTurnCount,
      },
    };
  }

  // Game over
  let gameOver: BroadcastGameState['gameOver'] = null;
  if (state.phase === 'game-over') {
    const finalScores = state.teams
      .map((team) => {
        let total = 0;
        for (const rs of state.roundScores) {
          const ts = rs.teamScores.find((s) => s.teamId === team.id);
          total += ts?.points || 0;
        }
        return { teamName: team.name, points: total };
      })
      .sort((a, b) => b.points - a.points);

    const winner = finalScores[0];
    const isTie = finalScores.length > 1 && finalScores[0].points === finalScores[1].points;

    gameOver = {
      winningTeam: isTie ? "It's a tie!" : winner?.teamName || '',
      finalScores,
    };
  }

  return {
    phase,
    teams,
    currentRound,
    slipsRemaining: state.bowl.length,
    currentTurn,
    turnSummary,
    roundSummary,
    gameOver,
  };
}
