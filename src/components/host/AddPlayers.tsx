import { useState, useRef, useCallback, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Html5Qrcode } from 'html5-qrcode';
import { useGame } from '../../state/gameState';
import { generateJoinUrl, decodePayload } from '../../utils/qr';
import type { Player, Slip } from '../../types';
import { HostSlipEntry } from './HostSlipEntry';
import { findDuplicates } from '../../utils/dedup';

function ScanSuccessOverlay({ playerName, slipCount }: { playerName: string; slipCount: number }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-green-600 animate-scan-flash">
      <div className="text-center space-y-4">
        <div className="text-8xl">✓</div>
        <div className="text-3xl font-bold">{playerName}</div>
        <div className="text-xl text-green-100">{slipCount} slips added</div>
      </div>
    </div>
  );
}

export function AddPlayers() {
  const { state, dispatch } = useGame();
  const [scanning, setScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [scanSuccess, setScanSuccess] = useState<{ playerName: string; slipCount: number } | null>(null);
  const [showHostEntry, setShowHostEntry] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'qr-scanner';
  const pauseRef = useRef(false);
  const scannedPayloadsRef = useRef(new Set<string>());

  const joinUrl = generateJoinUrl(state.config.slipsPerPlayer);

  const stopScanning = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const scannerState = scannerRef.current.getState();
        if (scannerState === 2) { // SCANNING
          await scannerRef.current.stop();
        }
      } catch {
        // ignore
      }
      scannerRef.current = null;
    }
    setScanning(false);
  }, []);

  const startScanning = useCallback(async () => {
    if (scannerRef.current) return;

    setScanMessage(null);
    const scanner = new Html5Qrcode(scannerContainerId);
    scannerRef.current = scanner;
    setScanning(true);

    try {
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          if (pauseRef.current) return;
          pauseRef.current = true;

          // Ignore exact duplicate scans
          if (scannedPayloadsRef.current.has(decodedText)) {
            pauseRef.current = false;
            return;
          }

          const result = decodePayload(decodedText);
          if ('error' in result) {
            setScanMessage({ text: result.error, type: 'error' });
            setTimeout(() => {
              pauseRef.current = false;
              setScanMessage(null);
            }, 2000);
            return;
          }

          scannedPayloadsRef.current.add(decodedText);

          const playerId = crypto.randomUUID();
          const player: Player = {
            id: playerId,
            name: result.player,
            teamId: '',
          };
          const slips: Slip[] = result.slips.map(text => ({
            id: crypto.randomUUID(),
            text,
            contributedBy: playerId,
          }));

          dispatch({ type: 'ADD_PLAYER', player, slips });
          setScanSuccess({ playerName: result.player, slipCount: result.slips.length });

          setTimeout(() => {
            setScanSuccess(null);
            pauseRef.current = false;
          }, 1500);
        },
        () => {}, // ignore scan failures (no QR found in frame)
      );
    } catch {
      setScanMessage({ text: 'Camera access denied. Please allow camera access to scan QR codes.', type: 'error' });
      setScanning(false);
      scannerRef.current = null;
    }
  }, [dispatch]);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const handleHostSlips = (name: string, slipTexts: string[]) => {
    const playerId = crypto.randomUUID();
    const player: Player = { id: playerId, name, teamId: '' };
    const slips: Slip[] = slipTexts.map(text => ({
      id: crypto.randomUUID(),
      text,
      contributedBy: playerId,
    }));
    dispatch({ type: 'ADD_PLAYER', player, slips });
    setShowHostEntry(false);
  };

  const handleDone = async () => {
    await stopScanning();
    const { removedCount } = findDuplicates(state.allSlips);
    if (removedCount > 0) {
      dispatch({ type: 'SET_PHASE', phase: 'duplicate-check' });
    } else {
      dispatch({ type: 'SET_PHASE', phase: 'team-assignment' });
    }
  };

  if (showHostEntry) {
    return (
      <div className="flex-1 p-4 max-w-lg mx-auto w-full slide-up">
        <HostSlipEntry
          slipsRequired={state.config.slipsPerPlayer}
          onComplete={handleHostSlips}
          onCancel={() => setShowHostEntry(false)}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 max-w-lg mx-auto w-full space-y-6 slide-up">
      {scanSuccess && (
        <ScanSuccessOverlay playerName={scanSuccess.playerName} slipCount={scanSuccess.slipCount} />
      )}
      <h2 className="text-2xl font-bold text-center">Add Players</h2>

      {/* Join QR Code */}
      <div className="text-center space-y-3">
        <p className="text-slate-400">Players: scan this code to write your slips</p>
        <div className="bg-white p-4 rounded-xl inline-block">
          <QRCodeSVG value={joinUrl} size={200} level="M" />
        </div>
      </div>

      {/* Scanner */}
      <div className="space-y-3">
        <div id={scannerContainerId} className={`rounded-lg overflow-hidden ${scanning ? '' : 'hidden'}`} />

        {scanMessage && (
          <div
            className={`text-center py-2 px-4 rounded-lg font-medium ${
              scanMessage.type === 'success'
                ? 'bg-green-900/50 text-green-300'
                : 'bg-red-900/50 text-red-300'
            }`}
          >
            {scanMessage.text}
          </div>
        )}

        <div className="flex gap-2">
          {!scanning ? (
            <button
              onClick={startScanning}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold transition-colors"
            >
              Scan Player
            </button>
          ) : (
            <button
              onClick={stopScanning}
              className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold transition-colors"
            >
              Stop Scanning
            </button>
          )}
          <button
            onClick={() => setShowHostEntry(true)}
            className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold transition-colors"
          >
            Add Yourself
          </button>
        </div>
      </div>

      {/* Player List */}
      {state.players.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm text-slate-400">
            Players ({state.players.length})
          </h3>
          {state.players.map(p => (
            <div
              key={p.id}
              className="flex items-center justify-between bg-slate-800 rounded-lg px-4 py-2"
            >
              <div>
                <span className="font-medium">{p.name}</span>
                <span className="text-sm text-slate-400 ml-2">
                  {state.allSlips.filter(s => s.contributedBy === p.id).length} slips
                </span>
              </div>
              <button
                onClick={() => dispatch({ type: 'REMOVE_PLAYER', playerId: p.id })}
                className="text-red-400 hover:text-red-300 text-sm"
                aria-label={`Remove ${p.name}`}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={handleDone}
        disabled={state.players.length < 4}
        className="w-full py-4 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:text-slate-500 rounded-xl text-lg font-bold transition-colors"
      >
        {state.players.length < 4
          ? `Need ${4 - state.players.length} more player${4 - state.players.length > 1 ? 's' : ''}`
          : 'Done Adding Players'}
      </button>
    </div>
  );
}
