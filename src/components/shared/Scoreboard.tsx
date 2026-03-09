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
    return { team, total };
  });

  if (compact) {
    return (
      <div className="flex gap-4 justify-center text-sm">
        {teamScores.map(({ team, total }) => (
          <span key={team.id} className="text-slate-300">
            {team.name}: <span className="font-bold text-white">{total}</span>
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-4 justify-center">
      {teamScores.map(({ team, total }) => (
        <div key={team.id} className="bg-slate-800 rounded-lg px-4 py-2 text-center min-w-[100px]">
          <div className="text-sm text-slate-400">{team.name}</div>
          <div className="text-2xl font-bold">{total}</div>
        </div>
      ))}
    </div>
  );
}
