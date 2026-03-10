import { useEffect, useRef, useState, useCallback } from 'react';
import Peer, { type DataConnection } from 'peerjs';
import type {
  ConnectionStatus,
  HostToPlayerMessage,
  PlayerToHostMessage,
  BroadcastGameState,
  TurnAssignmentMessage,
  PlayerAcceptedMessage,
  PlayerRejectedMessage,
} from './messages';
import { isHostToPlayerMessage } from './messages';

const RECONNECT_BASE_DELAY = 1000;
const RECONNECT_MAX_DELAY = 15000;

interface UsePlayerPeerReturn {
  status: ConnectionStatus;
  send: (msg: PlayerToHostMessage) => void;
  gameState: BroadcastGameState | null;
  turnAssignment: TurnAssignmentMessage | null;
  clearTurnAssignment: () => void;
  lastAccepted: PlayerAcceptedMessage | null;
  lastRejected: PlayerRejectedMessage | null;
  clearLastAccepted: () => void;
  clearLastRejected: () => void;
}

export function usePlayerPeer(hostId: string): UsePlayerPeerReturn {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [gameState, setGameState] = useState<BroadcastGameState | null>(null);
  const [turnAssignment, setTurnAssignment] = useState<TurnAssignmentMessage | null>(null);
  const [lastAccepted, setLastAccepted] = useState<PlayerAcceptedMessage | null>(null);
  const [lastRejected, setLastRejected] = useState<PlayerRejectedMessage | null>(null);
  const peerRef = useRef<Peer | null>(null);
  const connRef = useRef<DataConnection | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const destroyedRef = useRef(false);
  const pendingMessagesRef = useRef<PlayerToHostMessage[]>([]);

  const setupConnection = useCallback((peer: Peer) => {
    const conn = peer.connect(hostId, { reliable: true });
    connRef.current = conn;

    conn.on('open', () => {
      setStatus('connected');
      reconnectAttemptRef.current = 0;

      // Flush any pending messages
      for (const msg of pendingMessagesRef.current) {
        conn.send(msg);
      }
      pendingMessagesRef.current = [];
    });

    conn.on('data', (data) => {
      if (!isHostToPlayerMessage(data)) return;
      const msg = data as HostToPlayerMessage;
      switch (msg.type) {
        case 'game_state':
          setGameState(msg.state);
          break;
        case 'turn_assignment':
          setTurnAssignment(msg);
          break;
        case 'player_accepted':
          setLastAccepted(msg);
          setLastRejected(null);
          break;
        case 'player_rejected':
          setLastRejected(msg);
          setLastAccepted(null);
          break;
      }
    });

    conn.on('close', () => {
      connRef.current = null;
      if (!destroyedRef.current) {
        setStatus('reconnecting');
        attemptReconnect(peer);
      }
    });

    conn.on('error', (err) => {
      console.error('[PlayerPeer] Connection error:', err);
      connRef.current = null;
      if (!destroyedRef.current) {
        setStatus('reconnecting');
        attemptReconnect(peer);
      }
    });
  }, [hostId]);

  const attemptReconnect = useCallback((peer: Peer) => {
    if (destroyedRef.current) return;

    const attempt = reconnectAttemptRef.current;
    const delay = Math.min(RECONNECT_BASE_DELAY * Math.pow(2, attempt), RECONNECT_MAX_DELAY);

    reconnectTimerRef.current = setTimeout(() => {
      if (destroyedRef.current) return;

      reconnectAttemptRef.current = attempt + 1;

      // If the peer itself is disconnected from the signaling server, reconnect it first
      if (peer.disconnected && !peer.destroyed) {
        peer.reconnect();
        // Wait a bit for the peer to reconnect to signaling, then connect to host
        setTimeout(() => {
          if (!destroyedRef.current && !peer.destroyed) {
            setupConnection(peer);
          }
        }, 1000);
      } else if (!peer.destroyed) {
        setupConnection(peer);
      }
    }, delay);
  }, [setupConnection]);

  useEffect(() => {
    destroyedRef.current = false;

    const peer = new Peer({
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      },
    });
    peerRef.current = peer;

    peer.on('open', () => {
      setupConnection(peer);
    });

    peer.on('error', (err) => {
      console.error('[PlayerPeer] Peer error:', err);
      // Don't set error status if we're already trying to reconnect
      if (err.type === 'peer-unavailable') {
        // Host peer ID not found — might be temporary
        setStatus('reconnecting');
        attemptReconnect(peer);
      } else if (err.type !== 'disconnected') {
        setStatus('error');
      }
    });

    peer.on('disconnected', () => {
      if (!destroyedRef.current) {
        setStatus('reconnecting');
        peer.reconnect();
      }
    });

    // Warn before unload during active turn
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (turnAssignment) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      destroyedRef.current = true;
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      peer.destroy();
      peerRef.current = null;
      connRef.current = null;
    };
  }, [hostId, setupConnection, attemptReconnect, turnAssignment]);

  const send = useCallback((msg: PlayerToHostMessage) => {
    const conn = connRef.current;
    if (conn?.open) {
      conn.send(msg);
    } else {
      // Queue messages (especially turn_result) to send on reconnect
      console.warn('[PlayerPeer] Connection not open — queuing message');
      pendingMessagesRef.current.push(msg);
    }
  }, []);

  const clearTurnAssignment = useCallback(() => setTurnAssignment(null), []);
  const clearLastAccepted = useCallback(() => setLastAccepted(null), []);
  const clearLastRejected = useCallback(() => setLastRejected(null), []);

  return {
    status,
    send,
    gameState,
    turnAssignment,
    clearTurnAssignment,
    lastAccepted,
    lastRejected,
    clearLastAccepted,
    clearLastRejected,
  };
}
