import { usePlayerNetwork } from '../../network/PlayerNetworkContext';

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

export function PlayerGameOver() {
  const { gameState } = usePlayerNetwork();

  if (!gameState?.gameOver) return null;

  const { gameOver } = gameState;

  return (
    <div className="flex-1 p-4 max-w-lg mx-auto w-full flex flex-col items-center justify-center space-y-6 slide-up relative">
      <Confetti />

      <div className="text-center space-y-2 z-10">
        <h1 className="text-4xl font-bold text-yellow-300">
          {gameOver.winningTeam}{gameOver.winningTeam === "It's a tie!" ? '' : ' wins!'}
        </h1>
      </div>

      {/* Final Scores */}
      <div className="flex gap-4 justify-center z-10">
        {gameOver.finalScores.map((ts, i) => (
          <div
            key={ts.teamName}
            className={`rounded-lg px-4 py-3 text-center min-w-[100px] ${
              i === 0 && gameOver.winningTeam !== "It's a tie!"
                ? 'bg-yellow-900/50 border border-yellow-600'
                : 'bg-slate-800'
            }`}
          >
            <div className="text-sm text-slate-400">{ts.teamName}</div>
            <div className="text-3xl font-bold">{ts.points}</div>
          </div>
        ))}
      </div>

      <p className="text-slate-500 text-sm z-10">Waiting for host...</p>
    </div>
  );
}
