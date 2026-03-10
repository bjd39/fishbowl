import { usePlayerNetwork } from '../../network/PlayerNetworkContext';

export function PlayerRoundSummary() {
  const { gameState } = usePlayerNetwork();

  if (!gameState?.roundSummary) return null;

  const { roundSummary } = gameState;

  return (
    <div className="flex-1 p-4 max-w-lg mx-auto w-full flex flex-col items-center justify-center space-y-6 slide-up">
      <div className="text-center space-y-1">
        <h2 className="text-3xl font-bold">{roundSummary.roundName}</h2>
        <p className="text-slate-300">Round complete!</p>
      </div>

      {/* Round scores */}
      <div className="w-full space-y-2">
        <h3 className="text-sm text-slate-400 text-center">This round</h3>
        <div className="flex gap-4 justify-center">
          {roundSummary.teamScores.map((ts) => (
            <div key={ts.teamName} className="bg-slate-800 rounded-lg px-4 py-2 text-center min-w-[100px]">
              <div className="text-sm text-slate-400">{ts.teamName}</div>
              <div className="text-xl font-bold">+{ts.roundPoints}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Cumulative scores */}
      <div className="w-full space-y-2">
        <h3 className="text-sm text-slate-400 text-center">Overall</h3>
        <div className="flex gap-4 justify-center">
          {roundSummary.teamScores.map((ts) => (
            <div key={ts.teamName} className="bg-slate-800 rounded-lg px-4 py-2 text-center min-w-[100px]">
              <div className="text-sm text-slate-400">{ts.teamName}</div>
              <div className="text-2xl font-bold">{ts.totalPoints}</div>
            </div>
          ))}
        </div>
      </div>

      {/* MVP */}
      {roundSummary.mvp.count > 0 && (
        <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-lg p-4 text-center">
          <div className="text-sm text-yellow-400">Round MVP</div>
          <div className="text-xl font-bold text-yellow-300">{roundSummary.mvp.playerName}</div>
          <div className="text-sm text-yellow-400/70">
            {roundSummary.mvp.count} slips in a single turn
          </div>
        </div>
      )}

      <p className="text-slate-500 text-sm">Waiting for host to start next round...</p>
    </div>
  );
}
