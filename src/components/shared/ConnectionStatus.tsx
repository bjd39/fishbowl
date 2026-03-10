import type { ConnectionStatus as Status } from '../../network/messages';

const statusConfig: Record<Status, { color: string; label: string }> = {
  connecting: { color: 'bg-yellow-400', label: 'Connecting' },
  connected: { color: 'bg-green-400', label: 'Connected' },
  disconnected: { color: 'bg-red-400', label: 'Disconnected' },
  reconnecting: { color: 'bg-yellow-400', label: 'Reconnecting' },
  error: { color: 'bg-red-400', label: 'Error' },
};

export function ConnectionStatusBadge({ status }: { status: Status }) {
  const { color, label } = statusConfig[status];
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-slate-400">
      <span className={`w-2 h-2 rounded-full ${color} ${status === 'reconnecting' || status === 'connecting' ? 'animate-pulse' : ''}`} />
      {label}
    </span>
  );
}

export function ConnectionStatusDot({ status }: { status: Status }) {
  const { color } = statusConfig[status];
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${color} ${status === 'reconnecting' || status === 'connecting' ? 'animate-pulse' : ''}`}
      title={statusConfig[status].label}
    />
  );
}
