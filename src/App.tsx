import { useReducer, useEffect, useState, useCallback, useRef } from 'react';
import { gameReducer, initialGameState, GameContext } from './state/gameState';
import { WriterFlow } from './components/writer/WriterFlow';
import { GameSettings } from './components/host/GameSettings';
import { AddPlayers } from './components/host/AddPlayers';
import { DuplicateCheck } from './components/host/DuplicateCheck';
import { TeamAssignment } from './components/host/TeamAssignment';
import { TurnOrderSetup } from './components/host/TurnOrderSetup';
import { PreTurn } from './components/game/PreTurn';
import { ActiveTurn } from './components/game/ActiveTurn';
import { TurnSummary } from './components/game/TurnSummary';
import { RoundSummary } from './components/game/RoundSummary';
import { GameOver } from './components/game/GameOver';
import { HostNetworkProvider, useHostNetwork } from './network/HostNetworkContext';
import type { PlayerToHostMessage, HostToPlayerMessage } from './network/messages';
import { toBroadcastState } from './network/broadcastState';
import type { Player, Slip, GameState } from './types';
import { PlayerApp } from './components/player/PlayerApp';
import { HostActiveTurnWaiting } from './components/host/HostActiveTurnWaiting';

type Route =
  | { mode: 'host' }
  | { mode: 'writer'; slips: number }
  | { mode: 'player'; hostId: string; slips: number };

function getRoute(): Route {
  const hash = window.location.hash;
  if (hash.startsWith('#/join')) {
    const params = new URLSearchParams(hash.split('?')[1] || '');
    const hostId = params.get('hostId') || '';
    const slips = parseInt(params.get('slips') || '4', 10);
    return { mode: 'player', hostId, slips };
  }
  if (hash.startsWith('#/write')) {
    const params = new URLSearchParams(hash.split('?')[1] || '');
    const slips = parseInt(params.get('slips') || '4', 10);
    return { mode: 'writer', slips };
  }
  return { mode: 'host' };
}

function HostApp() {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);
  // Refs so the stable message handler callback can access current values
  const dispatchRef = useRef(dispatch);
  dispatchRef.current = dispatch;
  const stateRef = useRef(state);
  stateRef.current = state;
  // Populated after HostNetworkProvider mounts via NetworkBridge
  const sendToRef = useRef<((deviceId: string, msg: HostToPlayerMessage) => void) | null>(null);

  const handleNetworkMessage = useCallback(
    (deviceId: string, msg: PlayerToHostMessage) => {
      switch (msg.type) {
        case 'player_submit': {
          const playerId = crypto.randomUUID();
          const player: Player = {
            id: playerId,
            name: msg.playerName,
            teamId: '',
            deviceId,
          };
          const slips: Slip[] = msg.slips.map((text) => ({
            id: crypto.randomUUID(),
            text,
            contributedBy: playerId,
          }));
          dispatchRef.current({ type: 'ADD_PLAYER', player, slips });

          // Send acceptance back to the device
          sendToRef.current?.(deviceId, {
            type: 'player_accepted',
            player: { id: playerId, name: player.name, slipCount: slips.length },
          });
          break;
        }
        case 'turn_result': {
          dispatchRef.current({
            type: 'APPLY_TURN_RESULT',
            guessed: msg.guessed,
            remainingBowl: msg.guessed.length > 0
              // Reconstruct remaining bowl: original bowl minus guessed slips
              ? stateRef.current.bowl.filter(
                  (id) => !msg.guessed.some((g) => g.slipId === id),
                )
              : stateRef.current.bowl,
          });
          break;
        }
        case 'player_ready':
          // Player tapped "Start Turn" on their device
          break;
        case 'heartbeat':
          // Could display timer mirror on host — tracked via device lastSeen for now
          break;
      }
    },
    [],
  );

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (state.phase !== 'settings') {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [state.phase]);

  const renderPhase = () => {
    switch (state.phase) {
      case 'settings':
        return <GameSettings />;
      case 'add-players':
        return <AddPlayers />;
      case 'duplicate-check':
        return <DuplicateCheck />;
      case 'team-assignment':
        return <TeamAssignment />;
      case 'turn-order':
        return <TurnOrderSetup />;
      case 'pre-turn':
        // For remote players, host shows PreTurn but the "Start turn" dispatches START_REMOTE_TURN
        return <PreTurn />;
      case 'active-turn':
        // If turn is running on remote device, show waiting screen
        if (state.remoteTurnActive) {
          return <HostActiveTurnWaiting />;
        }
        return <ActiveTurn />;
      case 'turn-summary':
        return <TurnSummary />;
      case 'round-summary':
        return <RoundSummary />;
      case 'game-over':
        return <GameOver />;
      default:
        return <GameSettings />;
    }
  };

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      <HostNetworkProvider onMessage={handleNetworkMessage}>
        <NetworkBridge sendToRef={sendToRef} state={state} />
        <div className="min-h-full flex flex-col">
          {renderPhase()}
        </div>
      </HostNetworkProvider>
    </GameContext.Provider>
  );
}

/**
 * Bridges the gap between HostApp (which owns state) and HostNetworkContext
 * (which owns broadcast/sendTo). Must be rendered inside HostNetworkProvider.
 */
function NetworkBridge({
  sendToRef,
  state,
}: {
  sendToRef: React.MutableRefObject<((deviceId: string, msg: HostToPlayerMessage) => void) | null>;
  state: GameState;
}) {
  const { sendTo, broadcast, setOnDeviceReconnect } = useHostNetwork();
  sendToRef.current = sendTo;
  const stateRef = useRef(state);
  stateRef.current = state;

  // Register reconnect handler: re-send game state when a device reconnects
  useEffect(() => {
    setOnDeviceReconnect((deviceId: string) => {
      sendTo(deviceId, { type: 'game_state', state: toBroadcastState(stateRef.current) });
    });
  }, [setOnDeviceReconnect, sendTo]);

  // Broadcast game state to all connected devices whenever state changes
  const prevPhaseRef = useRef(state.phase);
  const prevBowlLenRef = useRef(state.bowl.length);
  const prevPlayersLenRef = useRef(state.players.length);
  const prevRoundScoresLenRef = useRef(state.roundScores.length);
  const prevTurnGuessedLenRef = useRef(state.turnGuessed.length);
  const prevRemoteTurnRef = useRef(state.remoteTurnActive);

  useEffect(() => {
    // Broadcast on meaningful state changes
    const phaseChanged = prevPhaseRef.current !== state.phase;
    const bowlChanged = prevBowlLenRef.current !== state.bowl.length;
    const playersChanged = prevPlayersLenRef.current !== state.players.length;
    const roundScoresChanged = prevRoundScoresLenRef.current !== state.roundScores.length;
    const turnGuessedChanged = prevTurnGuessedLenRef.current !== state.turnGuessed.length;

    if (phaseChanged || bowlChanged || playersChanged || roundScoresChanged || turnGuessedChanged) {
      broadcast({ type: 'game_state', state: toBroadcastState(state) });
    }

    // Send turn_assignment when a remote turn starts
    if (state.remoteTurnActive && !prevRemoteTurnRef.current && state.turnClueGiverId) {
      const player = state.players.find((p) => p.id === state.turnClueGiverId);
      if (player && player.deviceId !== 'host') {
        const round = state.config.rounds[state.currentRoundIndex];
        const bowlSlips = state.bowl.map((slipId) => {
          const slip = state.allSlips.find((s) => s.id === slipId);
          return { id: slipId, text: slip?.text || '' };
        });

        sendTo(player.deviceId, {
          type: 'turn_assignment',
          playerId: player.id,
          bowl: bowlSlips,
          timerDuration: state.config.timerDuration,
          passesAllowed: state.config.passesPerTurn === Infinity ? 999 : state.config.passesPerTurn,
          roundName: round?.name || '',
          roundDescription: round?.description || '',
        });
      }
    }

    prevPhaseRef.current = state.phase;
    prevBowlLenRef.current = state.bowl.length;
    prevPlayersLenRef.current = state.players.length;
    prevRoundScoresLenRef.current = state.roundScores.length;
    prevTurnGuessedLenRef.current = state.turnGuessed.length;
    prevRemoteTurnRef.current = state.remoteTurnActive;
  }, [state, broadcast, sendTo]);

  return null;
}

export default function App() {
  const [route, setRoute] = useState(getRoute);

  useEffect(() => {
    const onHash = () => setRoute(getRoute());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  if (route.mode === 'writer') {
    return <WriterFlow slipsRequired={route.slips} />;
  }

  if (route.mode === 'player') {
    return <PlayerApp hostId={route.hostId} slipsRequired={route.slips} />;
  }

  return <HostApp />;
}
