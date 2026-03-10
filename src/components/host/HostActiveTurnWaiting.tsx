import { useState, useEffect, useRef } from 'react';
import { useGame } from '../../state/gameState';
import { useHostNetwork } from '../../network/HostNetworkContext';
import { Scoreboard } from '../shared/Scoreboard';

const DISCONNECT_AUTO_END_MS = 30000; // Auto-force-end after 30s of disconnect

export function HostActiveTurnWaiting() {
  const { state, dispatch } = useGame();
  const { devices } = useHostNetwork();
  const [disconnectWarning, setDisconnectWarning] = useState(false);
  const autoEndTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const team = state.teams[state.currentTeamIndex];
  const playerId = team?.playerIds[team.currentPlayerIndex];
  const player = state.players.find((p) => p.id === playerId);
  const round = state.config.rounds[state.currentRoundIndex];

  // Check if the active player's device is disconnected
  const playerDevice = player ? devices.find((d) => d.id === player.deviceId) : null;
  const isDeviceDisconnected = playerDevice ? !playerDevice.connected : false;

  useEffect(() => {
    if (isDeviceDisconnected) {
      setDisconnectWarning(true);
      // Start auto-force-end countdown
      autoEndTimerRef.current = setTimeout(() => {
        dispatch({ type: 'APPLY_TURN_RESULT', guessed: [], remainingBowl: state.bowl });
      }, DISCONNECT_AUTO_END_MS);
    } else {
      setDisconnectWarning(false);
      if (autoEndTimerRef.current) {
        clearTimeout(autoEndTimerRef.current);
        autoEndTimerRef.current = null;
      }
    }
    return () => {
      if (autoEndTimerRef.current) {
        clearTimeout(autoEndTimerRef.current);
      }
    };
  }, [isDeviceDisconnected, dispatch, state.bowl]);

  const handleForceEnd = () => {
    dispatch({ type: 'APPLY_TURN_RESULT', guessed: [], remainingBowl: state.bowl });
  };

  return (
    <div className="flex-1 p-4 max-w-lg mx-auto w-full flex flex-col items-center justify-center space-y-6 slide-up">
      <div className="text-center space-y-1">
        <div className="text-sm text-slate-400">
          Round {state.currentRoundIndex + 1}: {round?.name}
        </div>
      </div>

      <Scoreboard />

      <div className="text-center space-y-2">
        <div className="text-sm text-slate-400">
          {state.bowl.length} slip{state.bowl.length !== 1 ? 's' : ''} remaining
        </div>
      </div>

      {disconnectWarning ? (
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="text-xl font-semibold text-yellow-400">
            {player?.name}'s device disconnected
          </div>
          <p className="text-slate-400 text-sm">
            Waiting for reconnection... Turn will auto-end in 30s
          </p>
        </div>
      ) : (
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="text-xl font-semibold">
            Waiting for {player?.name}'s turn...
          </div>
          <p className="text-sm text-slate-400">({team?.name})</p>
          <p className="text-slate-500 text-sm">
            Turn is running on their device
          </p>
        </div>
      )}

      <button
        onClick={handleForceEnd}
        className="py-2 px-4 text-red-400 hover:text-red-300 text-sm transition-colors"
      >
        Force end turn
      </button>
    </div>
  );
}
