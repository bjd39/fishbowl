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
  hasConnectedOnce: boolean;
  debugLog: string[];
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
  const [hasConnectedOnce, setHasConnectedOnce] = useState(false);
  const [debugLog, setDebugLog] = useState<string[]>([]);
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
  const hostIdRef = useRef(hostId);
  hostIdRef.current = hostId;
  const turnAssignmentRef = useRef(turnAssignment);
  turnAssignmentRef.current = turnAssignment;

  const log = useCallback((msg: string) => {
    const ts = new Date().toLocaleTimeString();
    const entry = `${ts} ${msg}`;
    console.log(`[PlayerPeer] ${msg}`);
    setDebugLog((prev) => [...prev.slice(-19), entry]);
  }, []);

  useEffect(() => {
    destroyedRef.current = false;

    log(`Creating peer, will connect to host: ${hostIdRef.current}`);

    const peer = new Peer({
      debug: 0,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          {
            urls: 'turn:openrelay.metered.ca:80',
            username: 'openrelayproject',
            credential: 'openrelayproject',
          },
          {
            urls: 'turn:openrelay.metered.ca:443',
            username: 'openrelayproject',
            credential: 'openrelayproject',
          },
          {
            urls: 'turns:openrelay.metered.ca:443',
            username: 'openrelayproject',
            credential: 'openrelayproject',
          },
        ],
      },
    });
    peerRef.current = peer;

    function setupConnection() {
      log(`Connecting to host peer: ${hostIdRef.current}`);
      const conn = peer.connect(hostIdRef.current, { reliable: true });
      connRef.current = conn;

      conn.on('open', () => {
        log('Connection open!');
        setStatus('connected');
        setHasConnectedOnce(true);
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
        log('Connection closed');
        connRef.current = null;
        if (!destroyedRef.current) {
          setStatus('reconnecting');
          attemptReconnect();
        }
      });

      conn.on('error', (err) => {
        log(`Connection error: ${err.type} ${err.message}`);
        connRef.current = null;
        if (!destroyedRef.current) {
          setStatus('reconnecting');
          attemptReconnect();
        }
      });
    }

    function attemptReconnect() {
      if (destroyedRef.current) return;

      const attempt = reconnectAttemptRef.current;
      const delay = Math.min(RECONNECT_BASE_DELAY * Math.pow(2, attempt), RECONNECT_MAX_DELAY);
      log(`Reconnect attempt ${attempt + 1} in ${delay}ms`);

      reconnectTimerRef.current = setTimeout(() => {
        if (destroyedRef.current) return;

        reconnectAttemptRef.current = attempt + 1;

        if (peer.disconnected && !peer.destroyed) {
          log('Peer disconnected from signaling, reconnecting peer first');
          peer.reconnect();
          setTimeout(() => {
            if (!destroyedRef.current && !peer.destroyed) {
              setupConnection();
            }
          }, 1000);
        } else if (!peer.destroyed) {
          setupConnection();
        }
      }, delay);
    }

    peer.on('open', (id) => {
      log(`Registered with signaling server as: ${id}`);
      setupConnection();
    });

    peer.on('error', (err) => {
      log(`Peer error: ${err.type} — ${err.message}`);
      if (err.type === 'peer-unavailable') {
        setStatus('reconnecting');
        attemptReconnect();
      } else if (err.type !== 'disconnected') {
        setStatus('error');
      }
    });

    peer.on('disconnected', () => {
      log('Disconnected from signaling server');
      if (!destroyedRef.current) {
        setStatus('reconnecting');
        peer.reconnect();
      }
    });

    // Warn before unload during active turn
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (turnAssignmentRef.current) {
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
  }, [hostId, log]);

  const send = useCallback((msg: PlayerToHostMessage) => {
    const conn = connRef.current;
    if (conn?.open) {
      conn.send(msg);
    } else {
      console.warn('[PlayerPeer] Connection not open — queuing message');
      pendingMessagesRef.current.push(msg);
    }
  }, []);

  const clearTurnAssignment = useCallback(() => setTurnAssignment(null), []);
  const clearLastAccepted = useCallback(() => setLastAccepted(null), []);
  const clearLastRejected = useCallback(() => setLastRejected(null), []);

  return {
    status,
    hasConnectedOnce,
    debugLog,
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
