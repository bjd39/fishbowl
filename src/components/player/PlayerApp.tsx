import { useState, useCallback } from 'react';
import { PlayerNetworkProvider, usePlayerNetwork } from '../../network/PlayerNetworkContext';
import { Connecting } from './Connecting';
import { WriteSlips } from './WriteSlips';
import { WaitingLobby } from './WaitingLobby';
import { PassiveView } from './PassiveView';
import { PlayerTurnSummary } from './PlayerTurnSummary';
import { PlayerRoundSummary } from './PlayerRoundSummary';
import { PlayerGameOver } from './PlayerGameOver';
import { PlayerActiveTurn } from './PlayerActiveTurn';
import { ReconnectingOverlay } from '../shared/ReconnectingOverlay';

type PlayerPhase = 'connecting' | 'write-slips' | 'waiting';

function PlayerFlow({ slipsRequired, hostId }: { slipsRequired: number; hostId: string }) {
  const { status, debugLog, gameState, turnAssignment, clearTurnAssignment } = usePlayerNetwork();
  const [phase, setPhase] = useState<PlayerPhase>('connecting');
  const [playerNames, setPlayerNames] = useState<string[]>([]);
  const [addingAnother, setAddingAnother] = useState(false);

  // Transition from connecting to write-slips once connected
  if (phase === 'connecting' && status === 'connected') {
    setPhase('write-slips');
  }

  const handleSlipsSubmitted = useCallback((name: string) => {
    setPlayerNames((prev) => [...prev, name]);
    setAddingAnother(false);
  }, []);

  const handleAddAnother = useCallback(() => {
    setAddingAnother(true);
  }, []);

  const handleTurnComplete = useCallback(() => {
    clearTurnAssignment();
  }, [clearTurnAssignment]);

  // If we have a turn assignment, show the active turn (highest priority)
  if (turnAssignment) {
    return (
      <PlayerActiveTurn
        assignment={turnAssignment}
        onTurnComplete={handleTurnComplete}
      />
    );
  }

  // If the game has started (host broadcast says playing/summary/over),
  // switch to the appropriate game view
  if (gameState && gameState.phase !== 'lobby') {
    switch (gameState.phase) {
      case 'playing':
        return <PassiveView playerNames={playerNames} />;
      case 'turn-summary':
        return <PlayerTurnSummary />;
      case 'round-summary':
        return <PlayerRoundSummary />;
      case 'game-over':
        return <PlayerGameOver />;
    }
  }

  if (phase === 'connecting') {
    return <Connecting status={status} hostId={hostId} debugLog={debugLog} />;
  }

  // Show write slips if no players submitted yet, or if adding another
  if (phase === 'write-slips' && (playerNames.length === 0 || addingAnother)) {
    return (
      <WriteSlips
        slipsRequired={slipsRequired}
        onSubmitted={handleSlipsSubmitted}
      />
    );
  }

  // After submitting, show success + option to add another, then waiting
  if (phase === 'write-slips' && playerNames.length > 0 && !addingAnother) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6">
        <div className="text-center space-y-3">
          <div className="text-6xl">✓</div>
          <h2 className="text-2xl font-bold">
            {playerNames[playerNames.length - 1]} added!
          </h2>
          <p className="text-slate-400">Slips submitted to the host</p>
        </div>

        <div className="w-full max-w-sm space-y-3">
          <button
            onClick={handleAddAnother}
            className="w-full py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold transition-colors"
          >
            Add another player on this device
          </button>
          <button
            onClick={() => setPhase('waiting')}
            className="w-full py-3 bg-green-600 hover:bg-green-500 rounded-lg font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return <WaitingLobby playerNames={playerNames} />;
}

function PlayerFlowWithOverlay({ slipsRequired, hostId }: { slipsRequired: number; hostId: string }) {
  const { status, hasConnectedOnce } = usePlayerNetwork();
  return (
    <>
      <PlayerFlow slipsRequired={slipsRequired} hostId={hostId} />
      {hasConnectedOnce && <ReconnectingOverlay status={status} />}
    </>
  );
}

export function PlayerApp({ hostId, slipsRequired }: { hostId: string; slipsRequired: number }) {
  return (
    <PlayerNetworkProvider hostId={hostId}>
      <div className="min-h-full flex flex-col">
        <PlayerFlowWithOverlay slipsRequired={slipsRequired} hostId={hostId} />
      </div>
    </PlayerNetworkProvider>
  );
}
