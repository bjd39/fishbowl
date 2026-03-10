import { usePlayerNetwork } from '../../network/PlayerNetworkContext';
import { ConnectionStatusBadge } from '../shared/ConnectionStatus';
import { PlayerScoreboard } from '../shared/Scoreboard';

interface Props {
  playerNames: string[];
}

export function PassiveView({ playerNames }: Props) {
  const { status, gameState } = usePlayerNetwork();

  if (!gameState) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400">Waiting for game state...</p>
        <ConnectionStatusBadge status={status} />
      </div>
    );
  }

  const { currentRound, currentTurn, slipsRemaining, teams } = gameState;
  const isMyTurn = currentTurn && playerNames.some(
    (name) => name === currentTurn.playerName,
  );

  return (
    <div className="flex-1 p-4 max-w-lg mx-auto w-full flex flex-col items-center justify-center space-y-6 slide-up">
      {/* Round info */}
      {currentRound && (
        <div className="text-center space-y-1">
          <div className="text-sm text-slate-400">
            Round {currentRound.index + 1}
          </div>
          <h2 className="text-3xl font-bold">{currentRound.name}</h2>
          {currentRound.description && (
            <p className="text-slate-300 text-sm">{currentRound.description}</p>
          )}
        </div>
      )}

      {/* Scores */}
      <PlayerScoreboard teams={teams} />

      {/* Bowl count */}
      <div className="text-center text-sm text-slate-400">
        {slipsRemaining} slip{slipsRemaining !== 1 ? 's' : ''} remaining
      </div>

      {/* Current turn */}
      {currentTurn && (
        <div className="text-center space-y-2">
          {isMyTurn ? (
            <div className="text-2xl font-bold text-green-400">
              It's your turn!
            </div>
          ) : (
            <>
              <div className="text-lg text-slate-300">
                <span className="font-bold text-white">{currentTurn.playerName}</span> is giving clues
              </div>
              <div className="text-sm text-slate-500">
                ({currentTurn.teamName})
              </div>
            </>
          )}
        </div>
      )}

      {/* Turn in progress indicator */}
      {currentTurn && !isMyTurn && (
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
          Turn in progress
        </div>
      )}

      <div className="mt-auto pt-4">
        <ConnectionStatusBadge status={status} />
      </div>
    </div>
  );
}
