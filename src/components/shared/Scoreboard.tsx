import { useGame } from '../../state/gameState';

export function Scoreboard({ compact = false }: { compact?: boolean }) {
  const { state } = useGame();

  // Cumulative scores across all completed rounds + current round
  const teamScores = state.teams.map(team => {
    let total = 0;
    for (const rs of state.roundScores) {
      const ts = rs.teamScores.find(s => s.teamId === team.id);
      total += ts?.points || 0;
    }
    // Add current round guesses
    for (const g of state.currentRoundGuesses) {
      if (g.teamId === team.id) total++;
    }
    return { name: team.name, total };
  });

  return <ScoreboardDisplay teamScores={teamScores} compact={compact} />;
}

/** Props-based scoreboard for player devices (no useGame context) */
export function PlayerScoreboard({
  teams,
  compact = false,
}: {
  teams: { name: string; score: number }[];
  compact?: boolean;
}) {
  const teamScores = teams.map(t => ({ name: t.name, total: t.score }));
  return <ScoreboardDisplay teamScores={teamScores} compact={compact} />;
}

function ScoreboardDisplay({
  teamScores,
  compact,
}: {
  teamScores: { name: string; total: number }[];
  compact: boolean;
}) {
  if (compact) {
    return (
      <div className="flex gap-4 justify-center text-sm">
        {teamScores.map(({ name, total }) => (
          <span key={name} className="text-slate-300">
            {name}: <span className="font-bold text-white">{total}</span>
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-4 justify-center">
      {teamScores.map(({ name, total }) => (
        <div key={name} className="bg-slate-800 rounded-lg px-4 py-2 text-center min-w-[100px]">
          <div className="text-sm text-slate-400">{name}</div>
          <div className="text-2xl font-bold">{total}</div>
        </div>
      ))}
    </div>
  );
}
