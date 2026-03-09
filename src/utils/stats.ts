import type { Guess, Player, RoundScore, Slip, Team } from '../types';

export function calculateRoundMVP(
  guesses: Guess[],
  roundIndex: number,
  players: Player[],
): { mvpPlayerId: string; mvpTurnCount: number } {
  // Group guesses by clue giver and find max per player (approximates single-turn MVP)
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
