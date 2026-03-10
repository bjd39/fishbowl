import { usePlayerNetwork } from '../../network/PlayerNetworkContext';
import { ConnectionStatusBadge } from '../shared/ConnectionStatus';

interface Props {
  playerNames: string[];
}

export function WaitingLobby({ playerNames }: Props) {
  const { status, gameState } = usePlayerNetwork();

  return (
    <div className="flex-1 flex flex-col items-center p-4 space-y-6">
      <h1 className="text-2xl font-bold text-center">🐟 Fishbowl</h1>

      <div className="text-center space-y-2">
        <div className="text-6xl mb-4">⏳</div>
        <h2 className="text-xl font-semibold">Waiting for host to start...</h2>
        <ConnectionStatusBadge status={status} />
      </div>

      {/* This device's players */}
      <div className="w-full max-w-sm space-y-2">
        <h3 className="text-sm text-slate-400">Your players on this device</h3>
        {playerNames.map((name) => (
          <div
            key={name}
            className="flex items-center gap-2 bg-slate-800 rounded-lg px-4 py-2"
          >
            <span className="text-green-400">✓</span>
            <span className="font-medium">{name}</span>
          </div>
        ))}
      </div>

      {/* All players from broadcast */}
      {gameState && gameState.teams.length > 0 && (
        <div className="w-full max-w-sm space-y-2">
          <h3 className="text-sm text-slate-400">All players</h3>
          {gameState.teams.flatMap((team) =>
            team.players.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-2 bg-slate-800 rounded-lg px-4 py-2"
              >
                <span className="font-medium">{p.name}</span>
                {playerNames.includes(p.name) && (
                  <span className="text-xs text-slate-500">(you)</span>
                )}
              </div>
            )),
          )}
        </div>
      )}
    </div>
  );
}
