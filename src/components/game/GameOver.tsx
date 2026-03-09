import { useMemo } from 'react';
import { useGame } from '../../state/gameState';
import { getFastestSlip, getMostSlipsSingleTurn } from '../../utils/stats';

function Confetti() {
  const colors = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7', '#ec4899'];
  const pieces = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 2,
    color: colors[i % colors.length],
    size: 6 + Math.random() * 8,
  }));

  return (
    <>
      {pieces.map(p => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            animationDelay: `${p.delay}s`,
            backgroundColor: p.color,
            width: `${p.size}px`,
            height: `${p.size}px`,
            borderRadius: Math.random() > 0.5 ? '50%' : '0',
          }}
        />
      ))}
    </>
  );
}

export function GameOver() {
  const { state, dispatch } = useGame();

  const cumulativeScores = useMemo(() => {
    return state.teams.map(team => {
      let total = 0;
      for (const rs of state.roundScores) {
        const ts = rs.teamScores.find(s => s.teamId === team.id);
        total += ts?.points || 0;
      }
      return { team, total };
    }).sort((a, b) => b.total - a.total);
  }, [state.teams, state.roundScores]);

  const winner = cumulativeScores[0];
  const isTie = cumulativeScores.length > 1 && cumulativeScores[0].total === cumulativeScores[1].total;

  // Gather all guesses from all rounds
  const allGuesses = useMemo(() => {
    // currentRoundGuesses are already folded into roundScores at this point
    // We need to reconstruct from roundScores... or we track all guesses.
    // For now, use currentRoundGuesses which has the last round's guesses.
    // TODO: proper all-guesses tracking
    return state.currentRoundGuesses;
  }, [state.currentRoundGuesses]);

  const fastestSlip = useMemo(
    () => getFastestSlip(allGuesses, state.allSlips, state.players),
    [allGuesses, state.allSlips, state.players],
  );

  const mostSlips = useMemo(
    () => getMostSlipsSingleTurn(state.roundScores, state.players),
    [state.roundScores, state.players],
  );

  return (
    <div className="flex-1 p-4 max-w-lg mx-auto w-full flex flex-col items-center justify-center space-y-6 slide-up relative">
      <Confetti />

      <div className="text-center space-y-2 z-10">
        {isTie ? (
          <h1 className="text-4xl font-bold">It's a Tie!</h1>
        ) : (
          <>
            <h1 className="text-4xl font-bold text-yellow-300">
              {winner.team.name} Wins!
            </h1>
          </>
        )}
      </div>

      {/* Final Scores */}
      <div className="flex gap-4 justify-center z-10">
        {cumulativeScores.map(({ team, total }, i) => (
          <div
            key={team.id}
            className={`rounded-lg px-4 py-3 text-center min-w-[100px] ${
              i === 0 && !isTie
                ? 'bg-yellow-900/50 border border-yellow-600'
                : 'bg-slate-800'
            }`}
          >
            <div className="text-sm text-slate-400">{team.name}</div>
            <div className="text-3xl font-bold">{total}</div>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="w-full space-y-3 z-10">
        <h3 className="text-sm text-slate-400 text-center">Stats</h3>

        {mostSlips && (
          <div className="bg-slate-800 rounded-lg p-3 text-center">
            <div className="text-xs text-slate-400">Most slips in a turn</div>
            <div className="font-semibold">{mostSlips.playerName}</div>
            <div className="text-sm text-slate-300">
              {mostSlips.count} slips (Round {mostSlips.roundIndex + 1})
            </div>
          </div>
        )}

        {fastestSlip && (
          <div className="bg-slate-800 rounded-lg p-3 text-center">
            <div className="text-xs text-slate-400">Fastest slip</div>
            <div className="font-semibold">"{fastestSlip.slipText}"</div>
            <div className="text-sm text-slate-300">
              {(fastestSlip.time / 1000).toFixed(1)}s by {fastestSlip.playerName}
            </div>
          </div>
        )}

        {/* Round MVPs */}
        {state.roundScores.map(rs => {
          const player = state.players.find(p => p.id === rs.mvpPlayerId);
          const round = state.config.rounds[rs.roundIndex];
          return (
            <div key={rs.roundIndex} className="bg-slate-800 rounded-lg p-3 text-center">
              <div className="text-xs text-slate-400">
                Round {rs.roundIndex + 1} MVP ({round?.name})
              </div>
              <div className="font-semibold">{player?.name}</div>
              <div className="text-sm text-slate-300">{rs.mvpTurnCount} slips</div>
            </div>
          );
        })}
      </div>

      <div className="w-full space-y-3 z-10">
        <button
          onClick={() => dispatch({ type: 'PLAY_AGAIN' })}
          className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-xl text-lg font-bold transition-colors"
        >
          Play Again
        </button>
        <button
          onClick={() => dispatch({ type: 'NEW_GAME' })}
          className="w-full py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold transition-colors"
        >
          New Game
        </button>
      </div>
    </div>
  );
}
