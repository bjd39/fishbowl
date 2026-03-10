import { createContext, useContext, type ReactNode } from 'react';
import { useHostPeer } from './useHostPeer';
import type { Device, ConnectionStatus, PlayerToHostMessage, HostToPlayerMessage } from './messages';

interface HostNetworkContextValue {
  hostId: string | null;
  devices: Device[];
  status: ConnectionStatus;
  broadcast: (msg: HostToPlayerMessage) => void;
  sendTo: (deviceId: string, msg: HostToPlayerMessage) => void;
  setOnDeviceReconnect: (cb: (deviceId: string) => void) => void;
}

const HostNetworkContext = createContext<HostNetworkContextValue | null>(null);

export function HostNetworkProvider({
  children,
  onMessage,
}: {
  children: ReactNode;
  onMessage: (deviceId: string, msg: PlayerToHostMessage) => void;
}) {
  const { hostId, devices, status, broadcast, sendTo, setOnDeviceReconnect } = useHostPeer(onMessage);

  return (
    <HostNetworkContext.Provider value={{ hostId, devices, status, broadcast, sendTo, setOnDeviceReconnect }}>
      {children}
    </HostNetworkContext.Provider>
  );
}

export function useHostNetwork(): HostNetworkContextValue {
  const ctx = useContext(HostNetworkContext);
  if (!ctx) {
    throw new Error('useHostNetwork must be used within HostNetworkProvider');
  }
  return ctx;
}
