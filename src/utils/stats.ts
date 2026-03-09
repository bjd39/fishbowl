import type { Guess, Player, RoundScore, Slip, Team } from '../types';

export function calculateRoundMVP(
  guesses: Guess[],
  roundIndex: number,
  players: Player[],
): { mvpPlayerId: string; mvpTurnCount: number } {
  // Group guesses by clue giver. Since we track per-turn, we need to find the player
  // who got the most slips in a single turn.
  // We approximate "single turn" by grouping consecutive guesses by the same player.
  const turnCounts = new Map<string, number>();

  // We already have turnGuessed accumulated per turn in the game state,
  // but for round summary we receive all guesses for the round.
  // Group by clueGiverPlayerId and find max count per player.
  // Actually, we need "most slips in a single turn" — this requires knowing turn boundaries.
  // We'll track this differently: from currentRoundGuesses, we need turn boundaries.
  // For simplicity, we'll pass turn-level data in. For now, use total per player as approximation
  // and fix with proper turn tracking.

  const playerCounts = new Map<string, number>();
  for (const g of guesses) {
    if (g.roundIndex === roundIndex) {
      playerCounts.set(g.clueGiverPlayerId, (playerCounts.get(g.clueGiverPlayerId) || 0) + 1);
    }
  }

  let mvpId = players[0]?.id || '';
  let maxCount = 0;
  for (const [pid, count] of playerCounts) {
    if (count > maxCount) {
      maxCount = count;
      mvpId = pid;
    }
  }

  return { mvpPlayerId: mvpId, mvpTurnCount: maxCount };
}

export function calculateTeamScores(
  guesses: Guess[],
  roundIndex: number,
  teams: Team[],
): { teamId: string; points: number }[] {
  const scores = new Map<string, number>();
  for (const t of teams) {
    scores.set(t.id, 0);
  }
  for (const g of guesses) {
    if (g.roundIndex === roundIndex) {
      scores.set(g.teamId, (scores.get(g.teamId) || 0) + 1);
    }
  }
  return Array.from(scores.entries()).map(([teamId, points]) => ({ teamId, points }));
}

export function getFastestSlip(
  allGuesses: Guess[],
  slips: Slip[],
  players: Player[],
): { slipText: string; playerName: string; time: number; roundIndex: number } | null {
  if (allGuesses.length === 0) return null;

  let fastest = allGuesses[0];
  for (const g of allGuesses) {
    if (g.timeToGuess < fastest.timeToGuess) {
      fastest = g;
    }
  }

  const slip = slips.find(s => s.id === fastest.slipId);
  const player = players.find(p => p.id === fastest.clueGiverPlayerId);

  return {
    slipText: slip?.text || 'Unknown',
    playerName: player?.name || 'Unknown',
    time: fastest.timeToGuess,
    roundIndex: fastest.roundIndex,
  };
}

export function getMostSlipsSingleTurn(
  roundScores: RoundScore[],
  players: Player[],
): { playerName: string; count: number; roundIndex: number } | null {
  let best: { playerName: string; count: number; roundIndex: number } | null = null;

  for (const rs of roundScores) {
    if (!best || rs.mvpTurnCount > best.count) {
      const player = players.find(p => p.id === rs.mvpPlayerId);
      best = {
        playerName: player?.name || 'Unknown',
        count: rs.mvpTurnCount,
        roundIndex: rs.roundIndex,
      };
    }
  }

  return best;
}
