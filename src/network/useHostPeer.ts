import { useEffect, useRef, useState, useCallback } from 'react';
import Peer, { type DataConnection } from 'peerjs';
import type { Device, PlayerToHostMessage, HostToPlayerMessage } from './messages';
import { isPlayerToHostMessage } from './messages';
import type { ConnectionStatus } from './messages';

const HEARTBEAT_TIMEOUT_MS = 15000; // Mark device as disconnected after 15s of no messages
const HEARTBEAT_CHECK_INTERVAL_MS = 5000;

interface UseHostPeerReturn {
  hostId: string | null;
  devices: Device[];
  status: ConnectionStatus;
  broadcast: (msg: HostToPlayerMessage) => void;
  sendTo: (deviceId: string, msg: HostToPlayerMessage) => void;
  setOnDeviceReconnect: (cb: (deviceId: string) => void) => void;
}

export function useHostPeer(
  onMessage: (deviceId: string, msg: PlayerToHostMessage) => void,
): UseHostPeerReturn {
  const [hostId, setHostId] = useState<string | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const peerRef = useRef<Peer | null>(null);
  const connectionsRef = useRef<Map<string, DataConnection>>(new Map());
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;
  // Callback to send current game state to a reconnected device
  const onDeviceReconnectRef = useRef<((deviceId: string) => void) | null>(null);

  useEffect(() => {
    const peerId = `fishbowl-${crypto.randomUUID().slice(0, 8)}`;
    const peer = new Peer(peerId, {
      debug: 2,
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

    peer.on('open', (id) => {
      console.log('[HostPeer] Registered with signaling server as:', id);
      setHostId(id);
      setStatus('connected');
    });

    peer.on('error', (err) => {
      console.error('[HostPeer] Error:', err.type, err);
      if (err.type === 'network' || err.type === 'server-error') {
        setStatus('error');
      }
    });

    peer.on('connection', (conn) => {
      const deviceId = conn.peer;

      conn.on('open', () => {
        // Replace any existing connection for this device (reconnection)
        const existing = connectionsRef.current.get(deviceId);
        if (existing && existing !== conn) {
          try { existing.close(); } catch { /* ignore */ }
        }
        connectionsRef.current.set(deviceId, conn);

        setDevices((prev) => {
          const existed = prev.find((d) => d.id === deviceId);
          if (existed) {
            // Device reconnected — notify so host can re-send game state
            onDeviceReconnectRef.current?.(deviceId);
            return prev.map((d) =>
              d.id === deviceId ? { ...d, connected: true, lastSeen: Date.now() } : d,
            );
          }
          return [
            ...prev,
            {
              id: deviceId,
              peerId: deviceId,
              playerIds: [],
              connected: true,
              lastSeen: Date.now(),
            },
          ];
        });
      });

      conn.on('data', (data) => {
        if (isPlayerToHostMessage(data)) {
          setDevices((prev) =>
            prev.map((d) => (d.id === deviceId ? { ...d, lastSeen: Date.now(), connected: true } : d)),
          );
          onMessageRef.current(deviceId, data);
        }
      });

      conn.on('close', () => {
        // Only mark disconnected if this is still the active connection
        if (connectionsRef.current.get(deviceId) === conn) {
          connectionsRef.current.delete(deviceId);
          setDevices((prev) =>
            prev.map((d) => (d.id === deviceId ? { ...d, connected: false } : d)),
          );
        }
      });

      conn.on('error', (err) => {
        console.error(`[HostPeer] Connection error from ${deviceId}:`, err);
      });
    });

    peer.on('disconnected', () => {
      setStatus('reconnecting');
      peer.reconnect();
    });

    // Heartbeat check: periodically mark devices as disconnected if no messages received
    const heartbeatCheck = setInterval(() => {
      const now = Date.now();
      setDevices((prev) =>
        prev.map((d) => {
          if (d.connected && now - d.lastSeen > HEARTBEAT_TIMEOUT_MS) {
            // Check if the connection is actually still open
            const conn = connectionsRef.current.get(d.id);
            if (!conn?.open) {
              connectionsRef.current.delete(d.id);
              return { ...d, connected: false };
            }
          }
          return d;
        }),
      );
    }, HEARTBEAT_CHECK_INTERVAL_MS);

    return () => {
      clearInterval(heartbeatCheck);
      peer.destroy();
      peerRef.current = null;
      connectionsRef.current.clear();
    };
  }, []);

  const broadcast = useCallback((msg: HostToPlayerMessage) => {
    for (const conn of connectionsRef.current.values()) {
      if (conn.open) {
        conn.send(msg);
      }
    }
  }, []);

  const sendTo = useCallback((deviceId: string, msg: HostToPlayerMessage) => {
    const conn = connectionsRef.current.get(deviceId);
    if (conn?.open) {
      conn.send(msg);
    }
  }, []);

  // Expose the reconnect callback setter
  const setOnDeviceReconnect = useCallback((cb: (deviceId: string) => void) => {
    onDeviceReconnectRef.current = cb;
  }, []);

  return { hostId, devices, status, broadcast, sendTo, setOnDeviceReconnect };
}
