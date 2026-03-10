import { createContext, useContext, type ReactNode } from 'react';
import { usePlayerPeer } from './usePlayerPeer';
import type {
  ConnectionStatus,
  PlayerToHostMessage,
  BroadcastGameState,
  TurnAssignmentMessage,
  PlayerAcceptedMessage,
  PlayerRejectedMessage,
} from './messages';

interface PlayerNetworkContextValue {
  status: ConnectionStatus;
  hasConnectedOnce: boolean;
  send: (msg: PlayerToHostMessage) => void;
  gameState: BroadcastGameState | null;
  turnAssignment: TurnAssignmentMessage | null;
  clearTurnAssignment: () => void;
  lastAccepted: PlayerAcceptedMessage | null;
  lastRejected: PlayerRejectedMessage | null;
  clearLastAccepted: () => void;
  clearLastRejected: () => void;
}

const PlayerNetworkContext = createContext<PlayerNetworkContextValue | null>(null);

export function PlayerNetworkProvider({
  children,
  hostId,
}: {
  children: ReactNode;
  hostId: string;
}) {
  const peer = usePlayerPeer(hostId);

  return (
    <PlayerNetworkContext.Provider value={peer}>
      {children}
    </PlayerNetworkContext.Provider>
  );
}

export function usePlayerNetwork(): PlayerNetworkContextValue {
  const ctx = useContext(PlayerNetworkContext);
  if (!ctx) {
    throw new Error('usePlayerNetwork must be used within PlayerNetworkProvider');
  }
  return ctx;
}
