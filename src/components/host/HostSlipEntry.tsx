import { useState } from 'react';

interface Props {
  slipsRequired: number;
  onComplete: (name: string, slips: string[]) => void;
  onCancel: () => void;
}

export function HostSlipEntry({ slipsRequired, onComplete, onCancel }: Props) {
  const [name, setName] = useState('');
  const [slips, setSlips] = useState<string[]>([]);
  const [current, setCurrent] = useState('');
  const [step, setStep] = useState<'name' | 'slips'>('name');

  const handleAddSlip = (e: React.FormEvent) => {
    e.preventDefault();
    const text = current.trim();
    if (!text || slips.length >= slipsRequired) return;
    setSlips([...slips, text]);
    setCurrent('');
  };

  if (step === 'name') {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-center">Add yourself</h3>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Your name"
          maxLength={40}
          autoFocus
          className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-600 text-white text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => name.trim() && setStep('slips')}
            disabled={!name.trim()}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 rounded-lg font-semibold transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <span className="text-lg font-medium">{name}</span>
        <span className="text-slate-400 ml-2">
          — {slips.length} of {slipsRequired} slips
        </span>
      </div>

      {slips.length < slipsRequired && (
        <form onSubmit={handleAddSlip} className="flex gap-2">
          <input
            type="text"
            value={current}
            onChange={e => setCurrent(e.target.value)}
            placeholder="Person, place, or thing..."
            maxLength={80}
            autoFocus
            className="flex-1 px-4 py-3 rounded-lg bg-slate-800 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!current.trim()}
            className="px-4 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 rounded-lg font-semibold transition-colors"
          >
            Add
          </button>
        </form>
      )}

      <ul className="space-y-2">
        {slips.map((slip, i) => (
          <li key={i} className="flex items-center justify-between bg-slate-800 rounded-lg px-4 py-2">
            <span className="truncate">{slip}</span>
            <button
              onClick={() => setSlips(slips.filter((_, j) => j !== i))}
              className="text-sm text-red-400 hover:text-red-300 ml-2 shrink-0"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>

      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => onComplete(name.trim(), slips)}
          disabled={slips.length !== slipsRequired}
          className="flex-1 py-3 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:text-slate-500 rounded-lg font-semibold transition-colors"
        >
          Add to game
        </button>
      </div>
    </div>
  );
}
