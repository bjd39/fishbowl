import { useGame } from '../../state/gameState';

export function RoundSummary() {
  const { state, dispatch } = useGame();

  const round = state.config.rounds[state.currentRoundIndex];
  const latestRoundScore = state.roundScores[state.roundScores.length - 1];

  const mvpPlayer = state.players.find(p => p.id === latestRoundScore?.mvpPlayerId);

  // Cumulative scores
  const cumulativeScores = state.teams.map(team => {
    let total = 0;
    for (const rs of state.roundScores) {
      const ts = rs.teamScores.find(s => s.teamId === team.id);
      total += ts?.points || 0;
    }
    return { team, total };
  });

  const nextRoundIndex = state.currentRoundIndex + 1;
  const nextRound = state.config.rounds[nextRoundIndex];

  return (
    <div className="flex-1 p-4 max-w-lg mx-auto w-full flex flex-col items-center justify-center space-y-6 slide-up">
      <div className="text-center space-y-1">
        <div className="text-sm text-slate-400">Round {state.currentRoundIndex + 1}</div>
        <h2 className="text-3xl font-bold">{round.name}</h2>
        <p className="text-slate-300">Round Complete!</p>
      </div>

      {/* Round scores */}
      {latestRoundScore && (
        <div className="w-full space-y-2">
          <h3 className="text-sm text-slate-400 text-center">This Round</h3>
          <div className="flex gap-4 justify-center">
            {latestRoundScore.teamScores.map(ts => {
              const team = state.teams.find(t => t.id === ts.teamId);
              return (
                <div key={ts.teamId} className="bg-slate-800 rounded-lg px-4 py-2 text-center min-w-[100px]">
                  <div className="text-sm text-slate-400">{team?.name}</div>
                  <div className="text-xl font-bold">+{ts.points}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cumulative scores */}
      <div className="w-full space-y-2">
        <h3 className="text-sm text-slate-400 text-center">Overall</h3>
        <div className="flex gap-4 justify-center">
          {cumulativeScores.map(({ team, total }) => (
            <div key={team.id} className="bg-slate-800 rounded-lg px-4 py-2 text-center min-w-[100px]">
              <div className="text-sm text-slate-400">{team.name}</div>
              <div className="text-2xl font-bold">{total}</div>
            </div>
          ))}
        </div>
      </div>

      {/* MVP */}
      {mvpPlayer && latestRoundScore && latestRoundScore.mvpTurnCount > 0 && (
        <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-lg p-4 text-center">
          <div className="text-sm text-yellow-400">Round MVP</div>
          <div className="text-xl font-bold text-yellow-300">{mvpPlayer.name}</div>
          <div className="text-sm text-yellow-400/70">
            {latestRoundScore.mvpTurnCount} slips in a single turn
          </div>
        </div>
      )}

      {nextRound ? (
        <button
          onClick={() => dispatch({ type: 'NEXT_ROUND' })}
          className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-xl text-lg font-bold transition-colors"
        >
          Start Round {nextRoundIndex + 1}: {nextRound.name}
        </button>
      ) : (
        <button
          onClick={() => dispatch({ type: 'END_ROUND' })}
          className="w-full py-4 bg-purple-600 hover:bg-purple-500 rounded-xl text-lg font-bold transition-colors"
        >
          See Final Results
        </button>
      )}
    </div>
  );
}
