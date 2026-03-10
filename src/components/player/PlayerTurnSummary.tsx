import { usePlayerNetwork } from '../../network/PlayerNetworkContext';
import { PlayerScoreboard } from '../shared/Scoreboard';

export function PlayerTurnSummary() {
  const { gameState } = usePlayerNetwork();

  if (!gameState?.turnSummary) return null;

  const { turnSummary, teams } = gameState;

  return (
    <div className="flex-1 p-4 max-w-lg mx-auto w-full flex flex-col items-center justify-center space-y-6 slide-up">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">
          {turnSummary.playerName} got {turnSummary.count} slip{turnSummary.count !== 1 ? 's' : ''}!
        </h2>
        <p className="text-sm text-slate-400">({turnSummary.teamName})</p>
      </div>

      {turnSummary.slipsGuessed.length > 0 && (
        <ul className="w-full space-y-2">
          {turnSummary.slipsGuessed.map((text, i) => (
            <li
              key={i}
              className="bg-slate-800 rounded-lg px-4 py-2 text-center"
            >
              {text}
            </li>
          ))}
        </ul>
      )}

      <PlayerScoreboard teams={teams} />

      <p className="text-slate-500 text-sm">Waiting for host...</p>
    </div>
  );
}
