import type { ConnectionStatus } from '../../network/messages';

interface Props {
  status: ConnectionStatus;
}

export function Connecting({ status }: Props) {
  const isError = status === 'error' || status === 'disconnected';

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6">
      {!isError ? (
        <>
          <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
          <h1 className="text-2xl font-bold text-white">Connecting to game...</h1>
          <p className="text-slate-400">Setting up a connection to the host device</p>
        </>
      ) : (
        <>
          <div className="text-6xl">⚠️</div>
          <h1 className="text-2xl font-bold text-white">Couldn't connect</h1>
          <p className="text-slate-400">
            Make sure the host has the game open and try scanning the QR code again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold transition-colors"
          >
            Try again
          </button>
        </>
      )}
    </div>
  );
}
