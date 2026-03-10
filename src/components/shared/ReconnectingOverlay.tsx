import type { ConnectionStatus } from '../../network/messages';

interface Props {
  status: ConnectionStatus;
}

export function ReconnectingOverlay({ status }: Props) {
  if (status !== 'reconnecting' && status !== 'disconnected') return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 flex items-center justify-center">
      <div className="text-center space-y-4 p-6">
        <div className="w-10 h-10 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto" />
        <h2 className="text-xl font-bold text-white">Connection lost</h2>
        <p className="text-slate-400 text-sm">Reconnecting to host...</p>
        {status === 'disconnected' && (
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-semibold transition-colors"
          >
            Reload page
          </button>
        )}
      </div>
    </div>
  );
}
