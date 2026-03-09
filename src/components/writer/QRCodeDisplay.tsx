import { QRCodeSVG } from 'qrcode.react';
import { encodePayload } from '../../utils/qr';

interface Props {
  playerName: string;
  slips: string[];
  onAddAnother: () => void;
}

export function QRCodeDisplay({ playerName, slips, onAddAnother }: Props) {
  const payload = encodePayload(playerName, slips);

  return (
    <div className="w-full max-w-sm space-y-6 text-center">
      <h2 className="text-xl font-bold">{playerName}</h2>

      <div className="bg-white p-4 rounded-xl inline-block mx-auto">
        <QRCodeSVG
          value={payload}
          size={256}
          level="M"
        />
      </div>

      <p className="text-slate-400">
        Show this to the game host to scan
      </p>

      <button
        onClick={onAddAnother}
        className="w-full py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold transition-colors"
      >
        Add Another Player
      </button>
    </div>
  );
}
